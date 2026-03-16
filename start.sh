# To launch frontend: 
cd frontend
npm install ; npm run dev

# To launch design-api, open a new terminal
cd services/design-api
.\design-api\Scripts\Activate.ps1
uvicorn design_app.main:app --port 8001 --reload

#pyenv activate design-api


(if you dont have the virtual environment created, run `pyenv virtualenv 3.12.0 design-api`, and then run `pyenv activate design-api`)
(if you dont have the dependencies installed, run `pip install -r requirements.txt`)
# launch the Design API


# To launch prediction-api, open a new terminal
cd services/prediction-api
.\prediction-api\Scripts\Activate.ps1
uvicorn prediction_app.main:app --port 8002 --reload
#pyenv activate prediction-api

(if you dont have the virtual environment created, run `pyenv virtualenv 3.12.0 prediction-api`, and then run `pyenv activate prediction-api`)
(if you dont have the dependencies installed, run `pip install -r requirements.txt`)
# launch the Prediction API


cd .\services\orchestrator-api\
.\orchestrator-api\Scripts\Activate.ps1
uvicorn main:app --port 8003 --reload