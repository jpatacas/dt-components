import ApartmentIcon from "@mui/icons-material/Apartment";
import SatelliteIcon from "@mui/icons-material/Satellite";
import BoltIcon from "@mui/icons-material/Bolt";
import SensorsIcon from "@mui/icons-material/Sensors";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ThermostatIcon from "@mui/icons-material/Thermostat";

export function getLayers(state: any) {
  const mode = state.dtMode;
  const view = state.building ? "building" : "map";

  if (view === "map") {
    const groups: any[] = [
      {
        title: "Descriptive",
        selection: "single",
        layers: [
          { id: "buildings", label: "Buildings", icon: <ApartmentIcon /> },
          { id: "satellite", label: "Satellite", icon: <SatelliteIcon /> },
        ],
      },
    ];

    if (mode === "diagnostic") {
      groups.push({
        title: "Diagnostic",
        selection: "multiple",
        layers: [
          { id: "temperature", label: "Temperature", icon: <ThermostatIcon /> },
          { id: "occupancy", label: "Occupancy", icon: <SensorsIcon /> },
          { id: "energyFlow", label: "Energy Flow", icon: <BoltIcon /> },
        ],
      });
    }

    if (mode === "performance") {
      groups.push({
        title: "Performance",
        selection: "single",
        layers: [
          { id: "energyKPI", label: "Energy KPI", icon: <AnalyticsIcon /> },
        ],
      });
    }

    return groups;
  }

  if (view === "building") {
    const groups: any[] = [
      {
        title: "Descriptive",
        selection: "single",
        layers: [
          { id: "buildings", label: "Structure", icon: <ApartmentIcon /> },
          { id: "satellite", label: "Satellite", icon: <SatelliteIcon /> },
        ],
      },
    ];

    if (mode === "diagnostic") {
      groups.push({
        title: "Diagnostic",
        selection: "multiple",
        layers: [
          { id: "temperature", label: "Temperature", icon: <ThermostatIcon /> },
          { id: "occupancy", label: "Occupancy", icon: <SensorsIcon /> },
          { id: "faults", label: "Fault detection", icon: <SensorsIcon /> },
          { id: "energyFlow", label: "Energy Flow", icon: <BoltIcon /> },
        ],
      });
    }

    if (mode === "performance") {
      groups.push({
        title: "Performance",
        selection: "single",
        layers: [
          {
            id: "energyPerf",
            label: "Energy performance",
            icon: <AnalyticsIcon />,
          },
        ],
      });
    }

    return groups;
  }

  return [];
}
