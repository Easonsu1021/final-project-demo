import itertools
import os
from pathlib import Path
from typing import Iterable, Sequence, Tuple

import gym
from gym import spaces
import joblib
import numpy as np
import torch

from . import schemas

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
GRID_STEPS = int(os.getenv("DESIGN_GRID_STEPS", "4"))
MAX_EVALS_CONVEX = int(os.getenv("DESIGN_MAX_EVALS_CONVEX", "512"))
MAX_EVALS_CONCAVE = int(os.getenv("DESIGN_MAX_EVALS_CONCAVE", "256"))


def _linspace_indices(size: int, steps: int) -> Sequence[int]:
    """Return evenly spaced indices for a dimension."""
    if size <= 0:
        return [0]
    if size <= steps:
        return list(range(size))
    raw = np.linspace(0, size - 1, num=steps)
    return sorted({int(round(val)) for val in raw})


def _generate_candidate_actions(action_space: spaces.MultiDiscrete, max_candidates: int, grid_steps: int) -> Sequence[Tuple[int, ...]]:
    if max_candidates <= 0:
        return []
    nvec = [int(v) for v in getattr(action_space, "nvec", [])]
    if not nvec:
        raise ValueError("Design action space is not configured correctly.")

    axes = [_linspace_indices(size, grid_steps) for size in nvec]
    grid_actions = list(itertools.product(*axes))
    rng = np.random.default_rng()

    if len(grid_actions) >= max_candidates:
        rng.shuffle(grid_actions)
        return grid_actions[:max_candidates]

    candidates = list(grid_actions)
    seen = {tuple(action) for action in candidates}
    while len(candidates) < max_candidates:
        action = tuple(int(rng.integers(0, size)) for size in nvec)
        if action not in seen:
            candidates.append(action)
            seen.add(action)
    return candidates


def _search_best_action(env: gym.Env, actions: Iterable[Tuple[int, ...]]):
    best_reward = float("-inf")
    best_action = None
    best_info = None

    for action in actions:
        env.reset()
        _, reward, _, info = env.step(action)
        if reward > best_reward:
            best_reward = reward
            best_action = action
            best_info = info

    if best_info is None:
        raise RuntimeError("No valid design actions were evaluated.")

    return best_reward, best_action, best_info

class MLP_C(torch.nn.Module):
    def __init__(self, input_dim=47):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(input_dim, 512), torch.nn.ReLU(), torch.nn.Dropout(0.2),
            torch.nn.Linear(512, 1024), torch.nn.ReLU(), torch.nn.Dropout(0.3),
            torch.nn.Linear(1024, 512), torch.nn.ReLU(), torch.nn.Dropout(0.3),
            torch.nn.Linear(512, 256), torch.nn.ReLU(), torch.nn.Dropout(0.2),
            torch.nn.Linear(256, 128), torch.nn.ReLU(), torch.nn.Dropout(0.1),
            torch.nn.Linear(128, 1200)
        )
    def forward(self, x):
        return self.net(x)

class MLP_S(torch.nn.Module):
    def __init__(self, input_dim=46):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(input_dim, 64), torch.nn.ReLU(),
            torch.nn.Linear(64, 128), torch.nn.ReLU(),
            torch.nn.Linear(128, 64), torch.nn.ReLU(),
            torch.nn.Linear(64, 1200)
        )
    def forward(self, x):
        return self.net(x)

class DesignService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Design service is using device: {self.device}")

        self.model_c = MLP_C().to(self.device)
        self.model_c.load_state_dict(torch.load(ASSETS_DIR / "mlp_xyz_C.pt", map_location=self.device))
        self.model_c.eval()
        self.scaler_x_c = joblib.load(ASSETS_DIR / "scaler_X_C.pkl")
        self.scaler_y_c = joblib.load(ASSETS_DIR / "scaler_Y_C.pkl")
        print("Convex (C) models for environment loaded successfully.")
        
        self.model_s = MLP_S().to(self.device)
        self.model_s.load_state_dict(torch.load(ASSETS_DIR / "mlp_xyz_S.pt", map_location=self.device))
        self.model_s.eval()
        self.scaler_x_s = joblib.load(ASSETS_DIR / "scaler_X_S.pkl")
        self.scaler_y_s = joblib.load(ASSETS_DIR / "scaler_Y_S.pkl")
        print("Concave (S) models for environment loaded successfully.")


    def run_design_c(self, inputs: schemas.DesignInput) -> schemas.DesignOutput:
        target_warpage_mm = inputs.target_warpage_um / 1000.0
        fixed_params = [inputs.copper, inputs.substrate] + inputs.sbthk_vals + inputs.material_vals
        env = WarpageEnv(self.model_c, self.scaler_x_c, self.scaler_y_c, fixed_params, target_warpage=target_warpage_mm)

        candidates = _generate_candidate_actions(env.action_space, MAX_EVALS_CONVEX, GRID_STEPS)
        best_reward, best_action, best_info = _search_best_action(env, candidates)
        print(f"Design convex search evaluated {len(candidates)} candidates; best reward={best_reward:.2f}; action={best_action}")

        final_inputs = best_info.get('inputs')
        if final_inputs is None:
            raise RuntimeError("Best convex design candidate did not return inputs.")
        final_inputs = np.array(final_inputs, dtype=float).flatten()
        if final_inputs.size < 47:
            padded = np.zeros(47, dtype=float)
            padded[:final_inputs.size] = final_inputs
            final_inputs = padded

        best_params = schemas.BestParameters(
            tool_height=float(final_inputs[0]),
            magnet=int(final_inputs[1]),
            jig=float(final_inputs[2]),
            b1=int(final_inputs[4]),
            w1=int(final_inputs[5]),
        )

        return schemas.DesignOutput(
            achieved_warpage_um=best_info.get('warpage', float('nan')) * 1000.0,
            best_parameters=best_params
        )

    def run_design_s(self, inputs: schemas.DesignInput) -> schemas.DesignOutput:
        target_warpage_mm = inputs.target_warpage_um / 1000.0
        fixed_params = [inputs.copper, inputs.substrate] + inputs.sbthk_vals + inputs.material_vals
        env = WarpageEnvS(self.model_s, self.scaler_x_s, self.scaler_y_s, fixed_params, target_warpage=target_warpage_mm)

        candidates = _generate_candidate_actions(env.action_space, MAX_EVALS_CONCAVE, GRID_STEPS)
        best_reward, best_action, best_info = _search_best_action(env, candidates)
        print(f"Design concave search evaluated {len(candidates)} candidates; best reward={best_reward:.2f}; action={best_action}")

        final_inputs = best_info.get('inputs')
        if final_inputs is None:
            raise RuntimeError("Best concave design candidate did not return inputs.")
        final_inputs = np.array(final_inputs, dtype=float).flatten()
        if final_inputs.size < 46:
            padded = np.zeros(46, dtype=float)
            padded[:final_inputs.size] = final_inputs
            final_inputs = padded

        best_params = schemas.BestParameters(
            magnet=int(final_inputs[0]),
            jig=float(final_inputs[1]),
            b1=int(final_inputs[3]),
            w1=int(final_inputs[4]),
        )

        return schemas.DesignOutput(
            achieved_warpage_um=best_info.get('warpage', float('nan')) * 1000.0,
            best_parameters=best_params
        )

class WarpageEnv(gym.Env):
    def __init__(self, model, scaler_X, scaler_y, fixed_params, target_warpage=0.025):
        super().__init__()
        self.model = model
        self.scaler_X = scaler_X
        self.scaler_y = scaler_y
        self.target = float(target_warpage)
        self.fixed = np.array(fixed_params, dtype=np.float32)

        self.magnet_options = list(range(10, 41))
        self.jig_options = [0.5, 1.0, 1.5, 2.0]
        B1_values = list(range(40, 61))
        W1_values = list(range(47, 68))
        raw_hole_combos = [(B1, W1) for B1 in B1_values for W1 in W1_values]
        SB = float(self.fixed[1])
        self.hole_combos = [(B1, W1) for (B1, W1) in raw_hole_combos if (B1 <= SB and W1 <= SB)]
        if not self.hole_combos:
            raise ValueError(f"No valid (B1, W1) combinations for Substrate size {SB}. Please adjust.")
        self.tool_heights = [round(i * 0.001, 3) for i in range(51)]

        self.action_space = spaces.MultiDiscrete([len(self.magnet_options), len(self.jig_options), len(self.hole_combos), len(self.tool_heights)])
        self.observation_space = spaces.Box(low=-10.0, high=10.0, shape=(47,), dtype=np.float32)

    def reset(self):
        return np.zeros(47, dtype=np.float32)

    def step(self, action):
        idx_mag, idx_jig, idx_hole, idx_tool = action
        variable_input = np.array([
            self.tool_heights[idx_tool], self.magnet_options[idx_mag], self.jig_options[idx_jig],
            self.fixed[0], self.hole_combos[idx_hole][0], self.hole_combos[idx_hole][1], self.fixed[1]
        ], dtype=np.float32)

        full_input = np.concatenate([variable_input, self.fixed[2:]]).reshape(1, -1)
        x_scaled = self.scaler_X.transform(full_input)

        with torch.no_grad():
            x_tensor = torch.tensor(x_scaled, dtype=torch.float32, device=self.model.net[0].weight.device)
            y_pred_scaled = self.model(x_tensor).detach().cpu().numpy()
            y_pred = self.scaler_y.inverse_transform(y_pred_scaled)

        z_def = y_pred[0][800:]
        warpage = float(np.max(z_def) - np.min(z_def))
        error = warpage - self.target
        abs_error = abs(error)

        if abs_error < 1e-4: reward = 45.0
        elif abs_error < 5e-4: reward = 20.0
        elif abs_error < 1e-3: reward = 1.0
        else: reward = -abs_error * 100.0
        if error < 0: reward += 5.0

        info = {"inputs": full_input.flatten(), "warpage": warpage}
        return x_scaled.flatten().astype(np.float32), reward, True, info

class WarpageEnvS(gym.Env):
    def __init__(self, model, scaler_X, scaler_y, fixed_params, target_warpage=-0.014):
        super().__init__()
        self.model = model
        self.scaler_X = scaler_X
        self.scaler_y = scaler_y
        self.target = float(target_warpage)
        self.fixed = np.array(fixed_params, dtype=np.float32)

        self.magnet_options = list(range(10, 41))
        self.jig_options = [0.5, 1.0, 1.5, 2.0]
        B1_values = list(range(40, 61))
        W1_values = list(range(47, 68))
        raw_hole_combos = [(B1, W1) for B1 in B1_values for W1 in W1_values]
        SB = float(self.fixed[1])
        self.hole_combos = [(B1, W1) for (B1, W1) in raw_hole_combos if (B1 <= SB and W1 <= SB)]
        if not self.hole_combos:
            raise ValueError(f"No valid (B1, W1) combinations for Substrate size {SB}. Please adjust.")

        self.action_space = spaces.MultiDiscrete([len(self.magnet_options), len(self.jig_options), len(self.hole_combos)])
        self.observation_space = spaces.Box(low=-10.0, high=10.0, shape=(46,), dtype=np.float32)

    def reset(self):
        return np.zeros(46, dtype=np.float32)

    def step(self, action):
        idx_mag, idx_jig, idx_hole = action
        variable_input = np.array([
            self.magnet_options[idx_mag], self.jig_options[idx_jig],
            self.fixed[0], self.hole_combos[idx_hole][0], self.hole_combos[idx_hole][1], self.fixed[1]
        ], dtype=np.float32)

        full_input = np.concatenate([variable_input, self.fixed[2:]]).reshape(1, -1)
        x_scaled = self.scaler_X.transform(full_input)

        with torch.no_grad():
            x_tensor = torch.tensor(x_scaled, dtype=torch.float32, device=self.model.net[0].weight.device)
            y_pred_scaled = self.model(x_tensor).detach().cpu().numpy()
            y_pred = self.scaler_y.inverse_transform(y_pred_scaled)

        z_def = y_pred[0][800:]
        warpage = -(float(np.max(z_def) - np.min(z_def))) # Note the negative sign for concave
        error = warpage - self.target
        abs_error = abs(error)

        if abs_error < 1e-4: reward = 45.0
        elif abs_error < 5e-4: reward = 20.0
        elif abs_error < 1e-3: reward = 1.0
        else: reward = -abs_error * 100.0
        if error < 0: reward += 5.0

        info = {"inputs": full_input.flatten(), "warpage": warpage}
        return x_scaled.flatten().astype(np.float32), reward, True, info


