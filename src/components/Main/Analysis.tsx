import React, { useState, useEffect } from "react";
import "../../assets/css/App.css";
import TextField from "@mui/material/TextField";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import axios from "axios";

const Analysis: React.FC = () => {
  const [codes, setCodes] = useState<string[]>([""]);
  const [errorMessages, setErrorMessages] = useState<string[]>([""]);
  const [openErrorDialog, setOpenErrorDialog] = useState<boolean>(false);
  const [serverResponse, setServerResponse] = useState<any>(null);

  const addTextBox = () => {
    setCodes([...codes, ""]);
    setErrorMessages([...errorMessages, ""]);
  };

  const validateCode = (code: string): string | null => {
    if (!code) return "銘柄コードを入力してください。";
    if (code.length < 4) return "銘柄コードは4文字以上で入力してください。";
    if (!/^[A-Z0-9]+$/.test(code))
      return "銘柄コードは英大文字または数字のみです。";
    return null;
  };

  const handleInputChange = (index: number, value: string) => {
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);
  };

  const handleAnalyzeClick = async () => {
    const errors = codes.map((code) => validateCode(code) ?? "");
    setErrorMessages(errors);

    if (errors.some((error) => error !== null)) {
      setOpenErrorDialog(true);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/analyze`,
        { codes }
      );
      setServerResponse(response.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleCloseDialog = () => {
    setOpenErrorDialog(false);
  };

  return (
    <section>
      <h1>銘柄コード分析</h1>
      {codes.map((code, index) => (
        <TextField
          key={index}
          label={`銘柄コード ${index + 1}`}
          variant="standard"
          value={code}
          onChange={(e) => handleInputChange(index, e.target.value)}
          error={!!errorMessages[index]}
          helperText={errorMessages[index]}
          style={{ display: "block", marginBottom: "10px" }}
        />
      ))}
      <Button
        variant="contained"
        onClick={addTextBox}
        style={{ marginRight: "10px" }}
      >
        テキストボックス追加
      </Button>
      <Button variant="contained" color="primary" onClick={handleAnalyzeClick}>
        分析開始
      </Button>

      {/* エラーダイアログ */}
      <Dialog open={openErrorDialog} onClose={handleCloseDialog}>
        <DialogTitle>入力エラー</DialogTitle>
        <DialogContent>
          <p>入力された銘柄コードにエラーがあります。修正してください。</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* サーバーからのレスポンス表示 */}
      {serverResponse && <pre>{JSON.stringify(serverResponse, null, 2)}</pre>}
    </section>
  );
};

export default Analysis;
