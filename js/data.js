/* Contenido copiado de Notion ("Danzas tradicionales francesas").
   cat: c = En círculo y cadena · g = A 3 ó 4 ó + · p = A 2 · m = Mixers
   reg: región en el mapa (bre, cvl, ara, naq) o "" si se baila en toda Francia
   t = videos tutorial, m = música, s = partituras (Google Drive) */

window.CATEGORIES = {
  c: { name: "En círculo y cadena", desc: "Rondas, cadenas y danzas colectivas." },
  g: { name: "A 3 ó 4 ó +", desc: "Danzas para pequeños grupos." },
  p: { name: "A 2", desc: "Danzas y figuras para dos." },
  m: { name: "Mixers", desc: "Danzas con cambio de pareja." }
};

window.REGIONS = {
  bre: { name: "Bretaña", note: "Fest-noz, gavottes y andros: danzas en cadena tomadas del meñique." },
  cvl: { name: "Centro · Berry", note: "La tierra de la bourrée a dos tiempos y de los rondes del Indre." },
  ara: { name: "Auvernia", note: "Bourrées a tres tiempos del Macizo Central y rigaudons de montaña." },
  naq: { name: "Gascuña", note: "Rondeaux en cadena del suroeste." }
};

window.DANCES = [
  { n: "Andro", cat: "c", reg: "bre", t: ["qZnkDnLcZ2s"], m: ["h8lHPgf17-E", "MhW5N7oUogk", "7ryUSqtcxK8"], s: ["1uBBuwr0Qt80IOGpMF2QeVXq1hIXY-vkV"] },
  { n: "Andro retourné", cat: "c", reg: "bre", t: ["TSb8ViLEifw"], m: ["qZtg18CHf0I"], s: ["1GRNUGQ4hCFLOSU6sw2jOWQqnsTbWNkt9"] },
  { n: "Gavotte de Plougastell", cat: "c", reg: "bre", t: ["AboYFHR80c8"], m: ["soK4-UDUZCk", "4TuoM6Svrag"], s: ["1G1Qgj903jQ5YKzCZk6meNP9q1Yttlhl7", "11xFSFVARP64WOTTgRdFWGoKFEj8AnpZ0"] },
  { n: "Gavotte des montagnes", cat: "c", reg: "bre", t: ["uFoJPRgG_ko", "-KqqLt_eK5Y"], m: ["soK4-UDUZCk", "4TuoM6Svrag", "5ifLDdYobOA"], s: ["15rzkDX8sIw18hkc0f-jiu5nKy-N0CADm", "11xFSFVARP64WOTTgRdFWGoKFEj8AnpZ0"] },
  { n: "Bourrée de Sainte-Sévère (3 temps)", cat: "c", reg: "cvl", t: ["6VuBvgGD9C0"], m: ["kVGXTgM2jtc"], s: ["1V25Z7owp0nnWPI0eMbY4EJqP47QN82ff"] },
  { n: "Rond d’Argenton", cat: "c", reg: "cvl", t: ["PoooOnbKAa4", "O9V_YFBml70"], m: ["906Sv_U0Aso", "RNklBAjmJ-U"], s: ["1L3MxTmBYZOhI-kL_wfjCtbk1T8c9gucx"] },
  { n: "Bourrée de la brande d’Ardentes (2 temps)", cat: "c", reg: "cvl", t: ["_xuatd1_CVQ", "jnQvluA3F1g"], m: ["RKoQsftGtMQ"], s: [] },
  { n: "Le rondeau en chaîne", cat: "c", reg: "naq", t: ["qcL7QFn0Ncc"], m: ["sGcoWUbzR4k"], s: [] },
  { n: "Scottish en ronde", cat: "c", reg: "", t: ["SBSOJU1Eekc"], m: ["y4hk4ncrst0", "urxm6Cn9ZCY"], s: ["1rWztMQNTjyZBao5VvIBGAEFKTcjR8yGj"] },
  { n: "Danse de l’ours", cat: "c", reg: "", t: ["Qk7njm6BKXo"], m: ["4OxnnRI8fnc"], s: [] },
  { n: "Branle du parlement", cat: "c", reg: "", t: ["G0WMNd4FVN0"], m: [], s: ["114A5OOsQ0ghBPrdxZMlYYY36rRFFVtPf"] },
  { n: "Branle simple", cat: "c", reg: "", t: ["1_wyypH_3LE"], m: ["ZlNP0_8kCOA", "pzhwVTpjHM0", "Yh7PtpYv9vQ"], s: ["1SCl2N0yoDmyJ4Ka0L06JFgT32eIefnf6", "106DQ1pw37bu17os04RrPyeLnm4Y1_S0-"] },
  { n: "Branle double", cat: "c", reg: "", t: ["YwZxURxryNg"], m: ["APCbm_Vx9DY", "Yh7PtpYv9vQ"], s: ["1SG-owiw2ZwcX5AEOccMVpjLx_bTrCZ10"] },
  { n: "Branles coupés", cat: "c", reg: "", t: ["WKDvE47rL0w", "Yu0I5DAc3T8"], m: ["RfV24IJH0ds"], s: [] },
  { n: "Le branle de la Montarde", cat: "c", reg: "", t: ["8uCcT4v3Dr0"], m: ["y61M9YHYOk4"], s: [] },

  { n: "Gavotte de l’Aven", cat: "g", reg: "bre", t: ["0hi1RU89iBc"], m: ["Csdv8T4e-RI", "kLvTkiQth7s"], s: [] },
  { n: "Avant-deux de Bazouges", cat: "g", reg: "bre", t: ["cMmCsLXE8P8", "DNnYo3vD_fg"], m: ["DEs2kC4yM6g"], s: [] },
  { n: "Bourrée d’Aurore Sand (2 temps)", cat: "g", reg: "cvl", t: ["04RdjP2y0Aw", "7Lpwe27wrwg"], m: ["k5xCAGDdUN8", "3rZ0KyZU5mg"], s: ["1iM5KY5lCOym6UPuL-NpI4Pb4AXKDmB_a"] },
  { n: "Bourrée à 6 (2 temps)", cat: "g", reg: "cvl", t: ["3V5tC673pRY"], m: ["EyHbafJyOe4", "JDiAcPq8GKA"], s: [] },
  { n: "Lo crouzado (bourrée 3 temps)", cat: "g", reg: "ara", t: ["petpQwMaeq8", "jAsWz2BRUSI"], m: ["r4e6C7JhUhc"], s: [] },
  { n: "Rigaudon d’âne", cat: "g", reg: "ara", t: ["WbhXY6_ptBc"], m: ["Ye2tj63g10A"], s: [] },
  { n: "Cochinchine", cat: "g", reg: "", t: ["Hsq8HdajAtw"], m: ["SWLnKJHlRZU"], s: [] },

  { n: "Bourrée 2 temps", cat: "p", reg: "cvl", t: ["yDCbfE0p3_Q", "-y1dqt7BhAU"], m: ["0T7_0K0tDWw"], s: [] },
  { n: "Bourrée 3 temps", cat: "p", reg: "ara", t: ["A186jBMs6sE", "8S_jL0XEMvE"], m: ["m0V-1764P_4", "K4eDOwzo42o"], s: [] },
  { n: "Bourrée des Grandes Poteries (3 temps)", cat: "p", reg: "", t: ["WQMZXjAgXCI", "4FG-wLymCL4"], m: ["3bhI3WbpeQ8"], s: [] },
  { n: "Branle du rat", cat: "p", reg: "", t: ["_bSHjxZ84ho"], m: ["ZrqnOYm4JnM"], s: ["1FpPYgI1DPueBrHOqMKt8A73gCvJ1aEGl"] },
  { n: "Scottish", cat: "p", reg: "", t: ["Bjw5O91jc_o"], m: ["7Glh9FcE_c8", "3V1Yryd5N6A"], s: [] },
  { n: "Mazurka", cat: "p", reg: "", t: ["SOMAKkDINZU", "OvDOxvYSPvI"], m: [], s: [] },
  { n: "Valse", cat: "p", reg: "", t: ["honwsw_O-Wg"], m: [], s: [] },
  { n: "Valse 5 temps", cat: "p", reg: "", t: ["LTW4X6qfz2w"], m: [], s: [] },
  { n: "Polka", cat: "p", reg: "", t: ["NK8chvcykP4"], m: [], s: [] },

  { n: "Cercle circassien", cat: "m", reg: "", t: ["X8iQtOlS8YI", "ffopIfHCTnY"], m: ["mlR2fwuLWr8", "gN3P8-aLI6s"], s: ["1f6FeR7m0ZYX_OZQbKDtEw42-P365cYx4", "1CZisv4IRoxbjLAbVCDwuFzq8817AlSNH"] },
  { n: "Chapelloise", cat: "m", reg: "", t: ["oeqQZKvSyNE"], m: ["aWQROsX99wo", "RBSBMhQioDI"], s: [] }
];
