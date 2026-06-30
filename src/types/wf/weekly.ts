// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ArchonHunt {
  name: string;
  missions: ArchonHuntMissions[];
}

interface ArchonHuntMissions {
  type: string;
  node: WFRegionShort;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
