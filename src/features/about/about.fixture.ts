import team1 from "@/assets/about/team-1.jpeg";
import team2 from "@/assets/about/team-2.jpeg";
import team3 from "@/assets/about/team-3.jpeg";
import team4 from "@/assets/about/team-4.jpeg";
import team5 from "@/assets/about/team-5.jpeg";
import team6 from "@/assets/about/team-6.jpeg";
import team7 from "@/assets/about/team-7.jpeg";
import team8 from "@/assets/about/team-8.jpeg";

import { msg } from "@/lib/i18n";

export const aboutTeam = [
  {
    name: "Apirak Panboonchu",
    role: "FOUNDER · INFRASTRUCTURE TEAM LEAD · DEVOPS ENGINEER",
    stars: 5,
    description:
      msg("about.team.apirak.bio", "ลบโค้ดพันบรรทัดได้ในพริบตา ปกติขอนอนต่ออีกห้านาทีก่อนออกศึก แต่ถ้ามีสาวงามอยู่แนวหน้า ม้าเพกาซัสยังต้องขอให้ขี่ช้าลง", "buyer"),
    image: team3,
  },
  {
    name: "Arlif Thongrakjan",
    role: "TECHNICAL CLOUD · OBSERVABILITY EXPERT · NETWORK ENGINEER",
    stars: 4,
    description:
      msg("about.team.arlif.bio", "รู้ทุกซอกมุมของโครงสร้างพื้นฐาน แต่ทุกครั้งที่ระบบล่ม จะรีบมาถามด้วยสีหน้าตกใจว่า “อ้าว ใครทำอะ เมื่อกี้ยังใช้ได้อยู่เลย”", "buyer"),
    image: team4,
  },
  {
    name: "Wichapon Akarak",
    role: "FOUNDER & CEO · LEAD BACKEND DEVELOPER",
    stars: 5,
    description:
      msg("about.team.wichapon.bio", "วางแผนล่วงหน้าได้สิบตา รัดกุมจนเทพเจ้ายังขอดูสไลด์ แต่พอได้ยินเสียงภรรยาเรียก จะหันกลับมาทำเป็นอ่าน Jira ทันที", "buyer"),
    image: team1,
  },
  {
    name: "Torntun Pookhow",
    role: "FOUNDER & CEO · FULL STACK DEVELOPER",
    stars: 5,
    description:
      msg("about.team.torntun.bio", "ไม่ว่าใครจะขอหรือไม่มีใครยอมทำ งานก็มาถึงมือเขาเสมอ ขนาด Jira ยังรู้ว่า Ticket ไร้เจ้าของควรส่งไปหาใคร", "buyer"),
    image: team5,
  },
  {
    name: "Krittatee Kerdklinhom",
    role: "LEAD DEVELOPER · SECURITY ENGINEER",
    stars: 4,
    description:
      msg("about.team.krittatee.bio", "สกัดผู้บุกรุกได้ก่อนใคร ไม่หวั่นแม้บั๊กระดับตำนาน แต่ในคืนที่เงียบสงบ มักนั่งมองทะเลแล้วรำพึงว่า “เขาจะกินข้าวหรือยังนะ”", "buyer"),
    image: team8,
  },
  {
    name: "Chanasorn Chirapongsathon",
    role: "QA TEAM LEAD · DEVELOPER",
    stars: 4,
    description:
      msg("about.team.chanasorn.bio", "อธิบายเรื่องซับซ้อนให้คนทั้งห้องพยักหน้าตามได้ แม้บางคนจะยังไม่เข้าใจ ยามว่างมักนั่งโชว์ความรู้และความหล่อ", "buyer"),
    image: team6,
  },
  {
    name: "Gritsada Moeithaisong",
    role: "AI ENGINEER · INTEGRATION DEVELOPER · SENIOR FRONTEND DEVELOPER",
    stars: 4,
    description:
      msg("about.team.gritsada.bio", "ว่ากันว่ารอยยิ้มหยุดสงครามได้ถึงสามครั้ง แฟนคลับต่อแถวจนวังต้องเปิดระบบจองคิว ส่วนเขายืนยันว่า “พวกเขาแค่มาดูการ์ด!”", "buyer"),
    image: team2,
  },
  {
    name: "Thanapat Julakarn",
    role: "ASSOCIATE DEVELOPER",
    stars: 1,
    description:
      msg("about.team.thanapat.bio", "สายตาเฉียบคมจนมองเห็นสาวงามได้จากอีกฟากทะเล แต่พอถามว่างานใน Sprint เสร็จหรือยัง กลับยกกล้องส่องทางไกลขึ้นมาทันที", "buyer"),
    image: team7,
  },
] as const;

// bio ของทีม (ชื่อ / ตำแหน่งไม่แปล) — ประกาศให้ tolgee CLI เห็น [TCG-550]
// @tolgee-key {"key": "about.team.apirak.bio", "ns": "buyer", "defaultValue": "ลบโค้ดพันบรรทัดได้ในพริบตา ปกติขอนอนต่ออีกห้านาทีก่อนออกศึก แต่ถ้ามีสาวงามอยู่แนวหน้า ม้าเพกาซัสยังต้องขอให้ขี่ช้าลง"}
// @tolgee-key {"key": "about.team.arlif.bio", "ns": "buyer", "defaultValue": "รู้ทุกซอกมุมของโครงสร้างพื้นฐาน แต่ทุกครั้งที่ระบบล่ม จะรีบมาถามด้วยสีหน้าตกใจว่า “อ้าว ใครทำอะ เมื่อกี้ยังใช้ได้อยู่เลย”"}
// @tolgee-key {"key": "about.team.wichapon.bio", "ns": "buyer", "defaultValue": "วางแผนล่วงหน้าได้สิบตา รัดกุมจนเทพเจ้ายังขอดูสไลด์ แต่พอได้ยินเสียงภรรยาเรียก จะหันกลับมาทำเป็นอ่าน Jira ทันที"}
// @tolgee-key {"key": "about.team.torntun.bio", "ns": "buyer", "defaultValue": "ไม่ว่าใครจะขอหรือไม่มีใครยอมทำ งานก็มาถึงมือเขาเสมอ ขนาด Jira ยังรู้ว่า Ticket ไร้เจ้าของควรส่งไปหาใคร"}
// @tolgee-key {"key": "about.team.krittatee.bio", "ns": "buyer", "defaultValue": "สกัดผู้บุกรุกได้ก่อนใคร ไม่หวั่นแม้บั๊กระดับตำนาน แต่ในคืนที่เงียบสงบ มักนั่งมองทะเลแล้วรำพึงว่า “เขาจะกินข้าวหรือยังนะ”"}
// @tolgee-key {"key": "about.team.chanasorn.bio", "ns": "buyer", "defaultValue": "อธิบายเรื่องซับซ้อนให้คนทั้งห้องพยักหน้าตามได้ แม้บางคนจะยังไม่เข้าใจ ยามว่างมักนั่งโชว์ความรู้และความหล่อ"}
// @tolgee-key {"key": "about.team.gritsada.bio", "ns": "buyer", "defaultValue": "ว่ากันว่ารอยยิ้มหยุดสงครามได้ถึงสามครั้ง แฟนคลับต่อแถวจนวังต้องเปิดระบบจองคิว ส่วนเขายืนยันว่า “พวกเขาแค่มาดูการ์ด!”"}
// @tolgee-key {"key": "about.team.thanapat.bio", "ns": "buyer", "defaultValue": "สายตาเฉียบคมจนมองเห็นสาวงามได้จากอีกฟากทะเล แต่พอถามว่างานใน Sprint เสร็จหรือยัง กลับยกกล้องส่องทางไกลขึ้นมาทันที"}
