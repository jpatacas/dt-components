import { type FC } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Checkbox,
  Typography,
  Box,
} from "@mui/material";

export const LayerSelector: FC<{
  open: boolean;
  layers: any[];
  selectedLayers: Record<string, string | string[]>;
  setSelectedLayers: React.Dispatch<any>;
}> = ({ open, layers, selectedLayers, setSelectedLayers }) => {
  if (!layers) return null;

  const toggleLayer = (
    groupTitle: string,
    layerId: string,
    selectionType: "single" | "multiple",
  ) => {
    if (selectionType === "single") {
      setSelectedLayers((prev: any) => ({
        ...prev,
        [groupTitle]: layerId,
      }));
    } else {
      setSelectedLayers((prev: any) => {
        const current = (prev[groupTitle] || []) as string[];

        const updated = current.includes(layerId)
          ? current.filter((l) => l !== layerId)
          : [...current, layerId];

        return {
          ...prev,
          [groupTitle]: updated,
        };
      });
    }
  };

  return (
    <Box>
      {layers.map((group) => (
        <Box key={group.title}>
          {open && (
            <Typography
              variant="caption"
              sx={{ pl: 2, pt: 1, pb: 1, opacity: 0.7 }}
            >
              {group.title}
            </Typography>
          )}

          <List dense>
            {group.layers.map((layer: any) => {
              const selected =
                group.selection === "single"
                  ? selectedLayers?.[group.title] === layer.id
                  : (selectedLayers?.[group.title] as string[])?.includes(
                      layer.id,
                    );

              return (
                <ListItem key={layer.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      toggleLayer(group.title, layer.id, group.selection)
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {open ? (
                        group.selection === "single" ? (
                          <Radio checked={selected} size="small" />
                        ) : (
                          <Checkbox checked={selected} size="small" />
                        )
                      ) : (
                        layer.icon
                      )}
                    </ListItemIcon>

                    {open && <ListItemText primary={layer.label} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
};
