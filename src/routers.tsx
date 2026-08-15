import React from "react";
import { Route, Routes } from "react-router-dom";
import { Login, ProtectedRoute } from "./components/User";
import { NotFound } from "./components/Others";
import { Analysis, FeatureSelection, Menu, Ranking } from "./components/Main";

const Routers = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Menu />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/feature-selection" element={<FeatureSelection />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default Routers;
