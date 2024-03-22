import { createTheme } from "@mui/material";
import components from "./components";
import breakpoints from "./breakpoints";
import typography from "./typography";
import palette from "./palette";

const theme = createTheme({
  typography,
  palette,
  breakpoints,
  components,
})

export default theme;