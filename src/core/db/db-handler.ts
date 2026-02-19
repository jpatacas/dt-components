import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import type { Building } from "../../types";
import type { Events } from "../../middleware/event-handler";
import { deleteDoc, getFirestore, doc, updateDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

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
    const dbInstance = getFirestore(getApp());
    await deleteDoc(doc(dbInstance, "buildings", building)); //building or building.uid?
    events.trigger({ type: "CLOSE_BUILDING" });
  },

  updateBuilding: async (building: Building) => {
    const dbInstance = getFirestore(getApp());
    await updateDoc(doc(dbInstance, "buildings", building), { //building or building.uid?
      ...building,
    });
  },
};
