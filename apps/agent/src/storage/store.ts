import Store from "electron-store";
import { v4 as uuidv4 } from "uuid";

type AgentStore = {
  equipmentUuid: string;
  token?: string;
};

const store = new Store<AgentStore>({
  name: "ti-chamados-agent",
  defaults: { equipmentUuid: uuidv4() },
});

export function getEquipmentUuid() {
  let uuid = store.get("equipmentUuid");
  if (!uuid) {
    uuid = uuidv4();
    store.set("equipmentUuid", uuid);
  }
  return uuid;
}

export function getToken() {
  return store.get("token");
}

export function setToken(token: string) {
  store.set("token", token);
}
