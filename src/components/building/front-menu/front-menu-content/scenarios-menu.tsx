import { type FC, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Slider,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { useAppContext } from "../../../../middleware/context-provider";

export const ScenariosMenu: FC = () => {
  const [state, dispatch] = useAppContext();

  const dashboard = state.buildingDashboard;

  const avgTemp = dashboard?.avgTemperature ?? 0;

  const [heatingOffset, setHeatingOffset] = useState(0);
  const [coolingOffset, setCoolingOffset] = useState(0);

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        HVAC Setpoint Adjustment Scenario
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Adjust the heating and cooling setpoints for all monitored rooms.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The scenario estimates how indoor temperatures would respond.
          </Typography>

          <Divider />

          <Typography>
            Current average indoor temperature:
            <strong> {avgTemp.toFixed(1)} °C</strong>
          </Typography>

          <Divider />

          <Box>
            <Typography gutterBottom>Heating Setpoint Adjustment</Typography>

            <Slider
              value={heatingOffset}
              min={-3}
              max={3}
              step={0.5}
              marks
              valueLabelDisplay="auto"
              onChange={(_, value) => setHeatingOffset(value as number)}
            />

            <Typography variant="body2" color="text.secondary">
              Apply{" "}
              <strong>
                {heatingOffset >= 0 ? "+" : ""}
                {heatingOffset.toFixed(1)}°C
              </strong>{" "}
              to the heating setpoint of every monitored room.
            </Typography>
          </Box>

          <Box>
            <Typography gutterBottom>Cooling Setpoint Adjustment</Typography>

            <Slider
              value={coolingOffset}
              min={-3}
              max={3}
              step={0.5}
              marks
              valueLabelDisplay="auto"
              onChange={(_, value) => setCoolingOffset(value as number)}
            />

            <Typography variant="body2" color="text.secondary">
              Apply{" "}
              <strong>
                {coolingOffset >= 0 ? "+" : ""}
                {coolingOffset.toFixed(1)}°C
              </strong>{" "}
              to the cooling setpoint of every monitored room.
            </Typography>
          </Box>

          <Divider />

          <Typography variant="subtitle2">Scenario Summary</Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Heating:</strong> {heatingOffset >= 0 ? "+" : ""}
                {heatingOffset.toFixed(1)}°C applied to every room heating
                setpoint.
              </Typography>

              <Typography variant="body2">
                <strong>Cooling:</strong> {coolingOffset >= 0 ? "+" : ""}
                {coolingOffset.toFixed(1)}°C applied to every room cooling
                setpoint.
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Rooms without an available setpoint will use the default
                scenario setpoints during the simulation.
              </Typography>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() =>
                dispatch({
                  type: "APPLY_SCENARIO",
                  payload: {
                    heatingOffset,
                    coolingOffset,
                  },
                })
              }
            >
              Apply Scenario
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setHeatingOffset(0);
                setCoolingOffset(0);

                dispatch({
                  type: "RESET_SCENARIO",
                });
              }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
