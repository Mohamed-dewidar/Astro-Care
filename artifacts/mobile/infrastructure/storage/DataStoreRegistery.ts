import { DataStore } from "./DataStoreTypes";

type DataStoreFactory = () => DataStore;

class DataStoreRegistry {
  private readonly dataStores: Map<string, DataStoreFactory> = new Map();

  register(name: string, dataStore: DataStoreFactory) {
    this.dataStores.set(name, dataStore);
    return this;
  }

  get(name: string): DataStore {
    const dataStore = this.dataStores.get(name);
    if (!dataStore) {
      throw new Error(`Data store ${name} not found`);
    }
    return dataStore();
  }
}

export default new DataStoreRegistry();
