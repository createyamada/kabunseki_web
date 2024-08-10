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
  caption: string;
  labels: string[];
  // isDisable: boolean;
  // isVisible: boolean;
}

interface Analysis {
  company: string;
  lastValue: string;
  predValue: string;
  score: string;
}

const CaptionTable: React.FC<props> = ({
  contents,
  caption,
  labels,
  // isDisable,
  // isVisible,
}) => {
  // export default function AccessibleTable() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="caption table">
        <caption>{caption}</caption>
        <TableHead>
          <TableRow>
            {labels.map((value, index) => (
              <TableCell key={index}>{value}</TableCell>
            ))}
            {/* <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
            <TableCell align="right">Fat&nbsp;(g)</TableCell>
            <TableCell align="right">Carbs&nbsp;(g)</TableCell>
            <TableCell align="right">Protein&nbsp;(g)</TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* {rows.map((row) => ( */}
          <TableRow>
            {Object.values(contents).map((value, index) => (
              <TableCell key={index}>{value}</TableCell>
            ))}
          </TableRow>
          {/* ))} */}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default CaptionTable;
