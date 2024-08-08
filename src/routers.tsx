import React from "react";
import { Routes, Route } from "react-router-dom";
import { Login, CreateUser } from "./components/User";
import { NotFound } from "./components/Others";
import { Analysis } from "./components/Main";

const Routers = () => {
  return (
    <Routes>
      {/* ****************************************
       *   その他
       **************************************** */}
      {/* 分析メイン画面画面 */}
      <Route path="/" element={<Analysis />} />
      {/* ログイン画面 */}
      <Route path="/login" element={<Login />} />
      {/* ユーザ作成画面 */}
      <Route path="/createUser" element={<CreateUser />} />
      {/* 404NotFound画面 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default Routers;
