import { type FC, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { useAppContext } from "../../../../middleware/context-provider";

export const ScenariosMenu: FC = () => {
  const [state, dispatch] = useAppContext();

  const originalTemperature = state.buildingDashboard?.avgTemperature ?? 0;

  const [hvacOn, setHvacOn] = useState(false);
  const [effect, setEffect] = useState(2);

  const simulatedTemperature = hvacOn
    ? originalTemperature - effect
    : originalTemperature + effect;

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Building Scenario
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={hvacOn}
                onChange={(e) => setHvacOn(e.target.checked)}
              />
            }
            label={hvacOn ? "HVAC ON" : "HVAC OFF"}
          />

          <Box>
            <Typography gutterBottom>HVAC Effect (°C)</Typography>

            <Slider
              value={effect}
              min={0}
              max={10}
              step={0.5}
              valueLabelDisplay="auto"
              onChange={(_, value) => setEffect(value as number)}
            />
          </Box>

          <Divider />

          <Typography>
            Current average temperature:
            <strong> {originalTemperature.toFixed(1)} °C</strong>
          </Typography>

          <Typography color="primary">
            Simulated average temperature:
            <strong> {simulatedTemperature.toFixed(1)} °C</strong>
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() =>
                dispatch({
                  type: "APPLY_SCENARIO",
                  payload: {
                    hvacOn,
                    temperatureOffset: hvacOn ? -effect : effect,
                  },
                })
              }
            >
              Apply
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setHvacOn(false);
                setEffect(2);

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
