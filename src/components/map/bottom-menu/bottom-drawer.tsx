import { type FC } from "react";
import { Box, Grid, Paper, Typography, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getBottomDrawer } from "../../utils/mui-utils";

export const BottomDrawer: FC<{
  open: boolean;
  toggleDrawer: () => void;
  kpis: {
    buildings: number;
    models: number;
  };
}> = ({ open, toggleDrawer, kpis }) => {

  const Drawer = getBottomDrawer(220);

  return (
    <Drawer anchor="bottom" variant="persistent" open={open} transitionDuration={{ enter: 350, exit: 250 }}>
      <Box sx={{ p: 2 }}>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">District KPIs</Typography>

          <IconButton onClick={toggleDrawer}>
            {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Buildings</Typography>
              <Typography variant="h5">{kpis.buildings}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Models</Typography>
              <Typography variant="h5">{kpis.models}</Typography>
            </Paper>
          </Grid>
        </Grid>

      </Box>
    </Drawer>
  );
};