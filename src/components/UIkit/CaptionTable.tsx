import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

interface props {
  contents: Analysis;
  labels: string[];
}

interface Analysis {
  company: string;
  lastValue: string;
  predValue: string;
  score: string;
}

const caption = [
  "1. 免責事項（Disclaimer）当ツールは、過去のデータや統計的手法に基づいた情報を提供しますが、将来の株価を保証するものではありません。投資判断は自己責任で行い、本ツールの使用により生じた損失について、当社は一切の責任を負いかねます。",
  "2. データの正確性に関する注意本ツールが提供する情報は、外部のデータソースを基にしています。可能な限り正確な情報を提供するよう努めていますが、データの遅延、誤り、欠落などが発生する可能性があります。そのため、本ツールの情報を投資判断の唯一の基準としないでください。",
  "3. 投資リスクに関する警告株式投資には元本割れのリスクがあり、市場の変動や経済状況により損失を被る可能性があります。投資を行う際は、ご自身で十分な調査を行い、必要に応じて専門家のアドバイスを受けることを推奨します。",
  "4. ツールの用途について本ツールは教育目的・情報提供を目的としており、金融機関や投資アドバイザーによる助言を代替するものではありません。投資の最終決定は、ご自身の判断で行ってください。",
];

const CaptionTable: React.FC<props> = ({ contents, labels }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="caption table">
        {caption.map((value, index) => (
          <caption
            style={{ margin: 10, padding: 0, whiteSpace: "pre-line" }}
            key={index}
          >
            {value}
          </caption>
        ))}
        <TableHead>
          <TableRow>
            {labels.map((value, index) => (
              <TableCell key={index}>{value}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            {Object.values(contents).map((value, index) => (
              <TableCell key={index}>{value}</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default CaptionTable;
