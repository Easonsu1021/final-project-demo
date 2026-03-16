import React, { useEffect, useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import WarpagePredictor from '../../pcb/WarpagePredictor';
import WarpageDesigner from '../../pcb/WarpageDesigner';

const MODAL_COMPONENTS = {
    predictor: WarpagePredictor,
    designer: WarpageDesigner,
};

function Modal() {
    const { modalType, closeModal } = useModal();
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (modalType) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [modalType]);

    if (!modalType) return null;

    const ModalComponent = MODAL_COMPONENTS[modalType];

    return (
        <div className="modal-overlay">
            <div className="modal-window">
                <button onClick={closeModal} className="modal-close-btn">×</button>
                <div className="modal-content-area">
                    {ModalComponent && <ModalComponent />}
                </div>
            </div>
        </div>
    );
}

export default Modal;