import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (user && user.username) {
            api.get(`/user/profile/${user.username}`)
                .then(res => {
                    if (res.data) {
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    }
                })
                .catch(err => {
                    console.warn("Failed to sync user session on startup", err);
                });
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
