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

    // Delete all local models in parallel
    await Promise.all(
      building.models
        .filter((m) => m.localKey)
        .map((m) => localModelStore.delete(m.localKey!)),
    );

    // Delete Firestore metadata
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

    // Save file locally
    await localModelStore.save(localKey, file);

    // Create full model metadata
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
    // Delete locally
    await localModelStore.delete(model.localKey!);

    // Remove from metadata
    building.models = building.models.filter((m) => m.id !== model.id);

    const dbInstance = getFirestore(getApp());

    await updateDoc(doc(dbInstance, "buildings", building.uid), {
      models: building.models,
    });

    events.trigger({ type: "UPDATE_BUILDING", payload: building });
  },
};
