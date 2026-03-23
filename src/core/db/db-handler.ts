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
import { buildingHandler } from "../building/building-handler"; //avoid this in future update

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
    // Delete all IFC files anf fragment cache
    await Promise.all(
      building.models
        .filter((m) => m.localKey)
        .map((m) => {
          localModelStore.deleteIFC(m.localKey!);
          localModelStore.deleteFragments(m.localKey!);
        }),
    );

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
    //const localKey = building.uid;

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
    await buildingHandler.refreshModels(updatedBuilding, events);
  },

  deleteModel: async (model: Model, building: Building, events: Events) => {
    console.log("DELETE_MODEL args:", { model, building });
    await localModelStore.deleteIFC(model.localKey!);
    await localModelStore.deleteFragments(model.localKey!);

    const updatedBuilding: Building = {
      ...building,
      models: building.models.filter((m) => m.id !== model.id),
    };

    const dbInstance = getFirestore(getApp());

    await updateDoc(doc(dbInstance, "buildings", building.uid), {
      models: updatedBuilding.models,
    });

    events.trigger({ type: "UPDATE_BUILDING", payload: updatedBuilding });

    await buildingHandler.refreshModels(updatedBuilding, events);
        console.log("update building")
  },
};
