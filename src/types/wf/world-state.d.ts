interface WorldState {
  ActiveMissions: ActiveMission[];
  VoidStorms: VoidStorm[];
}

interface ActiveMission {
  _id: MongoObjectId;
  Region: number;
  Seed: number;
  Activation: MongoDate;
  Expiry: MongoDate;
  Node: string;
  MissionType: string;
  Modifier: string;
  Hard?: boolean;
}

interface VoidStorm {
  _id: MongoObjectId;
  Node: string;
  Activation: MongoDate;
  Expiry: MongoDate;
  ActiveMissionTier: string;
}

interface MongoObjectId {
  $oid: string;
}

interface MongoDate {
  $date: {
    $numberLong: string;
  };
}
