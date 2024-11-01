import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './Home';
import Dashboard from './pages/Dashboard';
import ManageAds from './pages/ManageAds';
import Library from './pages/Library';
import Scheduling from './pages/Scheduling';
import Devices from './pages/Devices';
import ChooseTemplate from './components/ChooseTemplate';
import EditTemplate from './pages/EditTemplate';
import Login from './pages/Login';

import Navbar from './components/Navbar';
import ProfileDropdown from './components/ProfileDropdown';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );

    const location = useLocation();

    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated);
    }, [isAuthenticated]);

    return (
        <div className="App">
            {location.pathname !== '/' && location.pathname !== '/login' && (
                <>
                    <Navbar />
                    <ProfileDropdown />
                </>
            )}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route 
                    path="/login" 
                    element={<Login setIsAuthenticated={setIsAuthenticated} />} 
                />
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route path="/adManagement" element={<ManageAds />} />
                <Route path="/adTemplate" element={<ChooseTemplate />} />
                <Route path="/library" element={<Library />} />
                <Route path="/scheduling" element={<Scheduling />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/edit-template" element={<EditTemplate />} />
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
