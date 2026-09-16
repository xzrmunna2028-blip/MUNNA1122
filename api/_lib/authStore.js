import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
class AuthStore {
  // USERS
  static async getUsers() {
    try {
      const colRef = collection(db, "registered_users");
      const snap = await getDocs(colRef);
      const list = [];
      snap.forEach((doc2) => {
        list.push(doc2.data());
      });
      if (list.length === 0) {
        const defaultUsers = [
          {
            id: "usr-master",
            name: "Munna",
            email: "xzrmunna7788@gmail.com",
            password: "XZRMUNNA12061",
            role: "Master Admin",
            status: "Active",
            createdAt: "2026-09-01"
          },
          {
            id: "usr-admin-alt",
            name: "Munna Admin",
            email: "xzrmunna974@gmail.com",
            password: "MUNNA11",
            role: "Admin",
            status: "Active",
            createdAt: "2026-09-01"
          },
          {
            id: "usr-demo",
            name: "Demo Operator",
            email: "user@codeflow.com",
            password: "codeflow123",
            role: "User",
            status: "Active",
            createdAt: "2026-09-01"
          }
        ];
        for (const u of defaultUsers) {
          await this.saveUser(u);
        }
        return defaultUsers;
      }
      return list;
    } catch (e) {
      console.error("[AuthStore] getUsers error:", e);
      return [];
    }
  }
  static async saveUser(user) {
    try {
      const cleanEmail = user.email.toLowerCase().trim();
      const userRef = doc(db, "registered_users", cleanEmail);
      await setDoc(userRef, {
        ...user,
        email: cleanEmail
      }, { merge: true });
    } catch (e) {
      console.error("[AuthStore] saveUser error:", e);
    }
  }
  static async saveUsers(users) {
    try {
      await Promise.all(users.map((u) => this.saveUser(u)));
    } catch (e) {
      console.error("[AuthStore] saveUsers error:", e);
    }
  }
  static async getPendingUsers() {
    const users = await this.getUsers();
    return users.filter((u) => u.status === "Pending");
  }
  // INVITATIONS
  static async getInvitations() {
    try {
      const colRef = collection(db, "invitations");
      const snap = await getDocs(colRef);
      const list = [];
      snap.forEach((doc2) => {
        list.push(doc2.data());
      });
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error("[AuthStore] getInvitations error:", e);
      return [];
    }
  }
  static async saveInvitation(inv) {
    try {
      const token = inv.token.trim();
      const ref = doc(db, "invitations", token);
      await setDoc(ref, inv, { merge: true });
    } catch (e) {
      console.error("[AuthStore] saveInvitation error:", e);
    }
  }
  static async saveInvitations(invites) {
    try {
      await Promise.all(invites.map((i) => this.saveInvitation(i)));
    } catch (e) {
      console.error("[AuthStore] saveInvitations error:", e);
    }
  }
  // BROADCASTS
  static async getBroadcasts() {
    try {
      const colRef = collection(db, "broadcast_notices");
      const snap = await getDocs(colRef);
      const list = [];
      snap.forEach((doc2) => {
        list.push(doc2.data());
      });
      if (list.length === 0) {
        const defaultNotice = {
          id: "notice-welcome",
          title: "\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE \u0985\u09AB\u09BF\u09B6\u09BF\u09DF\u09BE\u09B2 \u09A8\u09CB\u099F\u09BF\u09B6",
          message: "\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u0985\u09AB\u09BF\u09B8\u09BF\u09DF\u09BE\u09B2 \u09A8\u09CB\u099F\u09BF\u09B6 \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE\u0964 \u09B8\u0995\u09B2 \u0986\u09AA\u09A1\u09C7\u099F \u09AA\u09C7\u09A4\u09C7 \u099A\u09CB\u0996 \u09B0\u09BE\u0996\u09C1\u09A8\u0964",
          category: "Update",
          targetRole: "all",
          pinned: true,
          author: "Munna (Admin)",
          createdAt: "2026-09-15"
        };
        await this.saveBroadcast(defaultNotice);
        return [defaultNotice];
      }
      return list;
    } catch (e) {
      console.error("[AuthStore] getBroadcasts error:", e);
      return [];
    }
  }
  static async saveBroadcast(b) {
    try {
      const ref = doc(db, "broadcast_notices", b.id);
      await setDoc(ref, b, { merge: true });
    } catch (e) {
      console.error("[AuthStore] saveBroadcast error:", e);
    }
  }
  static async deleteBroadcast(id) {
    try {
      const ref = doc(db, "broadcast_notices", id);
      await deleteDoc(ref);
    } catch (e) {
      console.error("[AuthStore] deleteBroadcast error:", e);
    }
  }
}
export {
  AuthStore
};
