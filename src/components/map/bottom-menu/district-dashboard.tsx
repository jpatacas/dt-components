import { type FC } from "react";
import { useAppContext } from "../../../middleware/context-provider";
import {
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getBottomDrawer } from "../../utils/mui-utils";

export const DistrictDashboard: FC<{
  open: boolean;
  toggleDrawer: () => void;
}> = ({ open, toggleDrawer }) => {
  const Drawer = getBottomDrawer(500);

  const [state] = useAppContext();

  const dashboard = state.districtDashboard;

  const format = (value?: number) =>
    value == null || Number.isNaN(value) ? "--" : value.toFixed(2);

  return (
    <Drawer
      anchor="bottom"
      variant="persistent"
      open={open}
      transitionDuration={{ enter: 350, exit: 250 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            p: 2,
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            // mb: 2,
          }}
        >
          <Typography variant="h6">District Dashboard</Typography>

          <IconButton onClick={toggleDrawer}>
            {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            pb: 2,
          }}
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Total Sensors</Typography>

                <Typography variant="h5">
                  {dashboard?.totalSensors ?? "--"}
                </Typography>

                <Typography variant="caption">
                  Urban Observatory sensors
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Monitored Sensors</Typography>

                <Typography
                  variant="h5"
                  color={
                    (dashboard?.sensorHealth ?? 0) >= 95
                      ? "success.main"
                      : (dashboard?.sensorHealth ?? 0) >= 80
                        ? "warning.main"
                        : "error.main"
                  }
                >
                  {format(dashboard?.sensorHealth)}%
                </Typography>

                <Typography variant="caption">
                  {dashboard?.monitoredSensors ?? "--"} / {dashboard?.totalSensors ?? "--"} monitored
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Average Temperature</Typography>

                <Typography variant="h5">
                  {format(dashboard?.avgTemperature)} °C
                </Typography>

                <Typography variant="caption">
                  Min {format(dashboard?.minTemperature)}°C / Max{" "}
                  {format(dashboard?.maxTemperature)}°C
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Average Humidity</Typography>

                <Typography variant="h5">
                  {format(dashboard?.avgHumidity)} %
                </Typography>

                <Typography variant="caption">
                  Min {format(dashboard?.minHumidity)}% / Max{" "}
                  {format(dashboard?.maxHumidity)}%
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Average NO₂</Typography>

                <Typography variant="h5">
                  {format(dashboard?.avgNO2)} ppm
                </Typography>

                <Typography variant="caption">
                  Min {format(dashboard?.minNO2)}ppm / Max{" "}
                  {format(dashboard?.maxNO2)}ppm
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Average PM2.5</Typography>

                <Typography variant="h5">
                  {format(dashboard?.avgPM25)} μg/m³
                </Typography>

                <Typography variant="caption">
                  Min {format(dashboard?.minPM25)}μg/m³ / Max{" "}
                  {format(dashboard?.maxPM25)}μg/m³
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Hottest Location</Typography>

                <Typography variant="h6">
                  {dashboard?.hottestLocation ?? "--"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Coldest Location</Typography>

                <Typography variant="h6">
                  {dashboard?.coldestLocation ?? "--"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Worst Air Quality Location
                </Typography>

                <Typography variant="h6">
                  {dashboard?.worstAirQualityLocation ?? "--"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Last Updated</Typography>

                <Typography variant="h6">
                  {dashboard?.lastUpdatedText ?? "--"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Active Environmental Alerts
                </Typography>

                <Typography
                  variant="h4"
                  color={
                    (dashboard?.alerts ?? 0) > 0 ? "error.main" : "success.main"
                  }
                >
                  {dashboard?.alerts ?? 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3 }}>
            <Typography sx={{ p: 2 }} variant="h6">
              Active Alerts
            </Typography>

            <TableContainer sx={{ maxHeight: 260 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sensor</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dashboard?.alertList?.length ? (
                    dashboard.alertList.map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell>{alert.sensor}</TableCell>

                        <TableCell>{alert.metric}</TableCell>

                        <TableCell align="right">
                          {format(alert.value)} {alert.unit}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={alert.severity}
                            color={
                              alert.severity === "critical"
                                ? "error"
                                : "warning"
                            }
                          />
                        </TableCell>

                        <TableCell>{alert.message}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No active alerts
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Drawer>
  );
};
