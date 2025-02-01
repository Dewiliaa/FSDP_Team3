function Alert() {
    return (
        <div className="alert-card">
            <h1 className="card-title">Alerts</h1>
            
            <style>{`
                .alert-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .card-title {
                    text-align: left;
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    padding-left: 20px;
                }
            `}</style>
        </div>
    );
}

export default Alert;