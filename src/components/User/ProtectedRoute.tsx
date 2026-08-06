import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clearAccessToken, getAccessToken, getAuthorizationHeaders } from "../../auth";

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const token = getAccessToken();
  const [authenticated, setAuthenticated] = useState<boolean | null>(token ? null : false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    axios.get(`${process.env.REACT_APP_KABUMMIKE_URL}/api/auth/session`, { headers: getAuthorizationHeaders() })
      .then(() => active && setAuthenticated(true))
      .catch(() => {
        clearAccessToken();
        if (active) setAuthenticated(false);
      });
    return () => { active = false; };
  }, [token]);

  if (authenticated === null) {
    return <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}><CircularProgress /></Box>;
  }
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
};

export default ProtectedRoute;
