import { Divider } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { type FC } from "react";
import { useAppContext } from "../../../../middleware/context-provider";
import "./front-menu-content.css";

export const PropertiesMenu: FC = () => {
  const [state, dispatch] = useAppContext();

  const chartData =
    state.sensorHistory
      ?.filter((_, index) => index % 10 === 0)
      .map((point) => ({
        time: new Date(point.time),
        value: Number(point.value),
      })) ?? [];

  return (
    <div>
      {Boolean(state.properties.length) ? (
        <Divider />
      ) : (
        <p>No item selected.</p>
      )}

      {state.properties.map((property) => {
        const isSensor = property.type === "sensor";

        return (
          <div key={property.name}>
            <div
              className={`value-pair list-item ${isSensor ? "sensor-row" : ""}`}
              onClick={() => {
                if (!isSensor) return;

                dispatch({
                  type: "SELECT_SENSOR",
                  payload: {
                    name: property.name,
                    timeseriesId: property.timeseriesId,
                    unit: property.unit,
                  },
                });
              }}
            >
              <div>{property.name}</div>
              <p>:</p>
              <div>{property.value}</div>
            </div>

            <Divider />
          </div>
        );
      })}

      {state.selectedSensor && state.sensorHistory.length > 0 && (
        <>
          <Divider />

          <div style={{ padding: "1rem" }}>
            <h4>
              {state.selectedSensor.name}
              {state.selectedSensor.unit && ` (${state.selectedSensor.unit})`}
            </h4>

            <LineChart
              height={300}
              dataset={chartData}
              xAxis={[
                {
                  dataKey: "time",
                  scaleType: "time",
                  valueFormatter: (value) =>
                    new Date(value).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                },
              ]}
              series={[
                {
                  dataKey: "value",
                  label: state.selectedSensor.name,
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};
