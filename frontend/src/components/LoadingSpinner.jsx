import React, { memo } from 'react';

const LoadingSpinner = memo(function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <span className="loading-text">{message}</span>
        </div>
    );
});

export default LoadingSpinner;
