// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { accessToken } = useAuth();

  // If user not logged in, redirect to login page
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the protected component
  return children;
}
 