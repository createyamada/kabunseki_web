import React, { useState } from "react";

import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Container, Paper, Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";

const Login: React.FC = () => {
  // ***********************************************
  // *
  // *  定数宣言
  // *
  // ***********************************************
  // 画面遷移の設定
  const navigate = useNavigate();
  //Paperタグ内のスタイリングの変数
  const paperStyle = { padding: "50px 20px", width: 600, margin: "20px auto" };
  const textStyle = { width: "250px", margin: "auto" };

  //UseStateの変数
  const [form, setForm] = useState({
    username: "",
    password: "",
    showPassword: true,
  });

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************

  // テキストチェンジ時にstateにセットするイベント
  const handleChange =
    (prop: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      // 下記処理に条件分岐を行わずにstateをセットしている
      setForm({ ...form, [prop]: e.target.value });
      // console.log(event.target.value);
      console.log("フォームパスワード表示");
      console.log(form.password);
    };

  // パスワードの横のアイコンクリックで表示するイベント
  const handleClickShowPassword = () => {
    setForm({
      ...form,
      showPassword: !form.showPassword,
    });
  };

  // アイコン再度クリックで非表示にするイベント
  const handleMouseDownPassword = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
  };

  // ***********************************************
  // *
  // *  ReturnDOM
  // *
  // ***********************************************
  return (
    <Container>
      <Paper elevation={3} style={paperStyle}>
        <h1 style={{ color: "blue" }}>
          <u></u>Login
        </h1>

        <Box
          component="form"
          sx={{
            "& > :not(style)": { m: 1 },
          }}
          noValidate
          autoComplete="off"
        >
          <div>
            {/* ユーザー名テキストボックス */}
            <TextField
              id="standard-basic"
              label="Username"
              variant="standard"
              style={textStyle}
              value={form.username}
              onChange={handleChange("username")}
            />
          </div>

          <div>
            <FormControl sx={{ m: 1, width: "25ch" }} variant="standard">
              <InputLabel htmlFor="standard-adornment-password">
                Password
              </InputLabel>
              <Input
                id="standard-adornment-password"
                type={form.showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {form.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </div>

          {/* submitボタン押下 */}
          <Button
            variant="contained"
            onClick={() =>
              navigate("/auth", {
                state: { username: form.username, password: form.password },
                replace: true,
              })
            }
          >
            Login
          </Button>

          {/* 新規作成ボタン押下 */}
          <Button
            variant="contained"
            onClick={() =>
              //クリック時のユーザー作成画面に遷移
              navigate("/createUser")
            }
          >
            Create
          </Button>

          <div>
            {/* パスワード忘れたとき */}
            <Button
              onClick={() =>
                //クリック時パスワードリセット画面に遷移
                navigate("/ResetPassword")
              }
            >
              パスワードを忘れたとき
            </Button>
          </div>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
