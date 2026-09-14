import z from "zod";

export const createBuildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  code: z
    .string()
    .min(1, "Building code is required")
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().optional(),
  address: z.string().optional(),
});

export const createFloorSchema = z.object({
  buildingId: z.string().min(1, "Building selection is required"),
  name: z.string().min(1, "Floor name is required"),
  code: z
    .string()
    .min(1, "Floor code is required")
    .transform((val) => val.trim().toUpperCase()),
  floorNumber: z.number().optional(),
});

export const createRoomSchema = z.object({
  floorId: z.string().min(1, "Floor selection is required"),
  roomTypeId: z.string().optional(),
  name: z.string().min(1, "Room name is required"),
  code: z
    .string()
    .min(1, "Room code is required")
    .transform((val) => val.trim().toUpperCase()),
  capacity: z.number().optional(),
  description: z.string().optional(),
});

export const createStockLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  code: z
    .string()
    .min(1, "Location code is required")
    .transform((val) => val.trim().toUpperCase()),
  type: z.enum(["STORE", "ROOM", "RACK", "SHELF", "CABINET", "OTHER"]),
  description: z.string().optional(),
  buildingId: z.string().optional(),
  floorId: z.string().optional(),
  roomId: z.string().optional(),
});

export type TCreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type TCreateFloorInput = z.infer<typeof createFloorSchema>;
export type TCreateRoomInput = z.infer<typeof createRoomSchema>;
export type TCreateStockLocationInput = z.infer<typeof createStockLocationSchema>;
