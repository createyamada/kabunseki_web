import React, { useState, useEffect } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

interface props {
  contents: Record<string, number>;
  onParentButtonClick: (days: number) => void; // コールバック関数の型
  // isDisable: boolean;
  // isVisible: boolean;
}

const ColorToggleButton: React.FC<props> = ({
  contents,
  onParentButtonClick,
  // isDisable,
  // isVisible,
}) => {
  // ***********************************************
  // *
  // *  状態管理
  // *
  // ***********************************************
  const [alignment, setAlignment] = useState<number>(
    Object.values(contents)[0]
  );

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************
  useEffect(() => {
    onParentButtonClick(alignment);
  }, [alignment]);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: number
  ) => {
    if (newAlignment == null) newAlignment = alignment;
    setAlignment(newAlignment);
  };

  return (
    <ToggleButtonGroup
      color="primary"
      value={alignment}
      exclusive
      onChange={handleChange}
      aria-label="Platform"
    >
      {Object.keys(contents).map((value, index) => (
        <ToggleButton key={index} value={Object.values(contents)[index]}>
          {value}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default ColorToggleButton;
