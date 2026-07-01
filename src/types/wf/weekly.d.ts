interface ArchonHunt {
  name: string;
  missions: ArchonHuntMissions[];
}

interface ArchonHuntMissions {
  type: string;
  node: WFRegionShort;
}

interface ArchiMedea {
  name: string;
  missions: ArchiMedeaMission[];
  peronal: ArchiMedeaDebuff[];
}

interface ArchiMedeaMission {
  type: string;
  deviation: ArchiMedeaDebuff;
  risks: ArchiMedeaDebuff[];
}

interface ArchiMedeaDebuff {
  name: string;
  desc: string;
}
