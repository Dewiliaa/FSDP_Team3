import React from 'react';
import Home from './Home';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar'; // Adjust the import based on your folder structure
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();

    return (
        <div className="App">
            {location.pathname !== '/' && <Navbar />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
}

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;
