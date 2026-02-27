import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import type { Building, Model } from "../../types";
import type { Events } from "../../middleware/event-handler";
import { deleteDoc, getFirestore, doc, updateDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import { localModelStore } from "./local-model-store";

export const databaseHandler = {
  login: () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  },
  logout: () => {
    const auth = getAuth();
    signOut(auth);
  },
deleteBuilding: async (building: Building, events: Events) => {

  // Delete all IFC files
  await Promise.all(
    building.models
      .filter((m) => m.localKey)
      .map((m) => localModelStore.deleteIFC(m.localKey!)),
  );

  // Delete fragment cache
  await localModelStore.deleteFragments(building.uid);

  const dbInstance = getFirestore();
  await deleteDoc(doc(dbInstance, "buildings", building.uid));

  events.trigger({ type: "CLOSE_BUILDING" });
},

  updateBuilding: async (building: Building) => {
    if (!building?.uid) {
      console.error("Invalid building passed to update:", building);
      throw new Error("Building UID is missing");
    }

    const dbInstance = getFirestore(getApp());
    const { uid, ...data } = building;

    await updateDoc(doc(dbInstance, "buildings", uid), data);
  },

uploadModel: async (
  model: Model,
  file: File,
  building: Building,
  events: Events,
) => {
  const localKey = `model_${crypto.randomUUID()}`;

  // Save IFC file only
  await localModelStore.saveIFC(localKey, file);

  const storedModel: Model = {
    ...model,
    localKey,
    size: file.size,
  };

  const updatedBuilding: Building = {
    ...building,
    models: [...building.models, storedModel],
  };

  const dbInstance = getFirestore(getApp());

  await updateDoc(doc(dbInstance, "buildings", building.uid), {
    models: updatedBuilding.models,
  });

  events.trigger({
    type: "UPDATE_BUILDING",
    payload: updatedBuilding,
  });
},

deleteModel: async (model: Model, building: Building, events: Events) => {

  // Delete IFC file
  await localModelStore.deleteIFC(model.localKey!);

  // Also delete fragment cache (force reconversion next open)
  await localModelStore.deleteFragments(building.uid);

  building.models = building.models.filter((m) => m.id !== model.id);

  const dbInstance = getFirestore(getApp());

  await updateDoc(doc(dbInstance, "buildings", building.uid), {
    models: building.models,
  });

  events.trigger({ type: "UPDATE_BUILDING", payload: building });
},
};
