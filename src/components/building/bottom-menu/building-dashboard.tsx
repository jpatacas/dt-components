import { type FC } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getBottomDrawer } from "../../utils/mui-utils";
import { useAppContext } from "../../../middleware/context-provider";

export const BuildingDashboard: FC<{
  open: boolean;
  toggleDrawer: () => void;
}> = ({ open, toggleDrawer }) => {
  const [state, dispatch] = useAppContext();

  const dashboard = state.buildingDashboard;
  // console.log("Dashboard:", dashboard);

  const Drawer = getBottomDrawer(500);

  const format = (value?: number) =>
    value !== undefined && value !== null ? value.toFixed(2) : "--";

 const scenario = state.buildingScenario;

const avgTemperature =
  scenario?.summary.avgTemperature ??
  state.buildingDashboard?.avgTemperature;

  return (
    <Drawer anchor="bottom" variant="persistent" open={open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
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
          <Typography variant="h6">Building Dashboard</Typography>

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
          <Grid container spacing={2}>
            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Occupancy</Typography>

                <Typography variant="h5">
                  {format(dashboard?.occupancyRate)}%
                </Typography>

                <Typography variant="caption">
                  {dashboard?.occupiedRooms ?? "--"} /{" "}
                  {dashboard?.monitoredRooms ?? "--"} rooms occupied
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Average Temperature</Typography>

                <Typography variant="h5">
                  {/* {format(dashboard?.avgTemperature)} °C */}
                  {format(avgTemperature)}°C
                </Typography>

                <Typography variant="caption">
                  Min {format(dashboard?.minTemperature)}° / Max{" "}
                  {format(dashboard?.maxTemperature)}°
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
                <Typography variant="subtitle2">Average CO₂</Typography>

                <Typography variant="h5">
                  {format(dashboard?.avgCO2)} ppm
                </Typography>
                <Typography variant="caption">
                  Min {format(dashboard?.minCO2)}ppm / Max{" "}
                  {format(dashboard?.maxCO2)}ppm
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Alerts</Typography>

                <Typography
                  variant="h5"
                  color={
                    dashboard && dashboard.alerts > 0
                      ? "error.main"
                      : "success.main"
                  }
                >
                  {dashboard?.alerts ?? "--"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Last Updated</Typography>

                <Typography variant="h5">
                  {dashboard?.lastUpdatedText ?? "--"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Building Comfort Index
                </Typography>

                <Typography
                  variant="h5"
                  color={
                    (dashboard?.comfortIndex ?? 0) > 80
                      ? "success.main"
                      : (dashboard?.comfortIndex ?? 0) > 60
                        ? "warning.main"
                        : "error.main"
                  }
                >
                  {format(dashboard?.comfortIndex)}%
                </Typography>

                <Typography variant="caption">
                  Overall indoor environmental quality
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Sensor Coverage</Typography>

                <Typography variant="h5">
                  {dashboard?.monitoredRooms ?? "--"} /{" "}
                  {dashboard?.totalRooms ?? "--"}
                </Typography>

                <Typography variant="caption">
                  {format(dashboard?.coveragePercentage)}% of spaces monitored
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Occupancy Trend</Typography>

                <Typography
                  variant="h5"
                  color={
                    (dashboard?.occupancyChange ?? 0) > 0
                      ? "success.main"
                      : (dashboard?.occupancyChange ?? 0) < 0
                        ? "warning.main"
                        : "text.primary"
                  }
                >
                  {(dashboard?.occupancyChange ?? 0) > 0 ? "+" : ""}
                  {format(dashboard?.occupancyChange)}%
                </Typography>

                <Typography variant="caption">Since previous update</Typography>
              </Paper>
            </Grid>

            <Grid item xs={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">Sensor Health</Typography>

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
                  {dashboard?.onlineSensors ?? "--"} /{" "}
                  {dashboard?.totalSensors ?? "--"} sensors online
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3 }}>
            <Typography sx={{ p: 2 }} variant="h6">
              Active Alerts
            </Typography>

            <TableContainer sx={{ maxHeight: 250 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dashboard?.alertList?.length ? (
                    dashboard.alertList.map((alert, index) => (
                      <TableRow
                        key={index}
                        onClick={() =>
                          dispatch({
                            type: "SELECT_ROOM",
                            payload: {
                              modelId: alert.modelId!,
                              localId: alert.localId!,
                            },
                          })
                        }
                      >
                        <TableCell>{alert.room}</TableCell>

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