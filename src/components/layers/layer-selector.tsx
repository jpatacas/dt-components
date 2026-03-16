import { type FC } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Typography,
  Box,
} from "@mui/material";

export const LayerSelector: FC<{
  open: boolean;
  layers: {
    title: string;
    layers: {
      id: string;
      label: string;
      icon: React.ReactNode;
    }[];
  }[];
  selectedLayers: Record<string, string>;
  setSelectedLayers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}> = ({ open, layers, selectedLayers, setSelectedLayers }) => {
  if (!layers || layers.length === 0) return null;

  const selectLayer = (groupTitle: string, layerId: string) => {
    setSelectedLayers((prev) => ({
      ...prev,
      [groupTitle]: layerId,
    }));
  };

  return (
    <Box>
      {layers.map((group) => (
        <Box key={group.title}>
          {open && (
            <Typography
              variant="caption"
              sx={{
                pl: 2,
                pt: 1,
                pb: 1,
                display: "block",
                opacity: 0.7,
              }}
            >
              {group.title}
            </Typography>
          )}

          <List dense>
            {group.layers.map((layer) => {
              const selected = selectedLayers[group.title] === layer.id;

              return (
                <ListItem key={layer.id} disablePadding>
                  <ListItemButton
                    onClick={() => selectLayer(group.title, layer.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {open ? (
                        <Radio checked={selected} size="small" />
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
