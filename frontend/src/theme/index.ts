import { createTheme } from "@mui/material";
import components from "./components";
import breakpoints from "./breakpoints";

const theme = createTheme({
  breakpoints,
  components
})

export default theme;