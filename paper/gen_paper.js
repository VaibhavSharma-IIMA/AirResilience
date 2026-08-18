// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Sundaravalli Narayanaswami and Vaibhav Sharma
const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,Table,TableRow,TableCell,
  WidthType,BorderStyle,ShadingType,ImageRun,Footer,PageNumber}=require("docx");
const fs=require("fs");

// ---------------------------------------------------------------------------
// Release metadata. These four values are the only placeholders left in the
// paper. Set them once here, then run scripts/finalize_release.py to propagate
// the same values into CITATION.cff, codemeta.json and pyproject.toml.
//
//   REPO   the public GitHub repository. Elsevier asks authors to avoid GitLab.
//          At submission this is your own repo; on acceptance Elsevier mirrors
//          the code and the published C2 becomes an ElsevierSoftwareX/SOFTX-D-*
//          repository, so nothing here needs to be permanent on your side.
//   DOI    Zenodo DOI minted from a tagged release. Field C3 will not pass
//          review as a promise; it has to be a live DOI at submission.
//   EMAIL  a real, monitored support address for C9.
//   CORRES the corresponding author's institutional address.
// ---------------------------------------------------------------------------
const VERSION= "1.0.0";
const REPO   = "https://github.com/GROUP-G-IIMA/airresilience";   // TODO: real repo
const DOI    = "https://doi.org/10.5281/zenodo.XXXXXXX";          // TODO: mint release
const EMAIL  = "sundaravallin@iima.ac.in";   // C9 support address
const CORRES = "sundaravallin@iima.ac.in";   // corresponding author
const EMAIL2 = "p25vaibhav@iima.ac.in";      // second author

const W=9360; // usable width, 1in margins on Letter
const INK="1A1A1A", NAVY="1F3A4D", GREY="595959", RULE="BFBFBF";
const T=(t,o={})=>new TextRun(Object.assign({text:t,font:"Times New Roman",size:20},o));
const B=t=>T(t,{bold:true}); const I=t=>T(t,{italics:true});
const C=t=>T(t,{font:"Consolas",size:17});
const P=(t,o={})=>new Paragraph({children:Array.isArray(t)?t:[T(t)],
  spacing:{after:o.after===undefined?120:o.after,line:240},alignment:o.align||AlignmentType.JUSTIFIED});
const H1=(n,t)=>new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:260,after:120},
  children:[new TextRun({text:n+". "+t,font:"Times New Roman",size:24,bold:true,color:NAVY})]});
const H2=(n,t)=>new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:180,after:90},
  children:[new TextRun({text:n+" "+t,font:"Times New Roman",size:21,bold:true,color:NAVY})]});
const BUL=t=>new Paragraph({numbering:{reference:"b",level:0},spacing:{after:70,line:240},
  children:Array.isArray(t)?t:[T(t)]});
function tbl(rows,widths,head=true){
  const cw=widths.map(f=>Math.round(W*f));
  const cell=(txt,i,isH)=>new TableCell({width:{size:cw[i],type:WidthType.DXA},
    margins:{top:50,bottom:50,left:90,right:90},
    shading:isH?{type:ShadingType.CLEAR,fill:"EDF1F3"}:undefined,
    children:(Array.isArray(txt)?txt:[txt]).map(x=>new Paragraph({spacing:{after:0,line:230},
      children:[new TextRun({text:String(x),font:"Times New Roman",size:17,bold:!!isH})]}))});
  return new Table({columnWidths:cw,width:{size:W,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.SINGLE,size:4,color:RULE},bottom:{style:BorderStyle.SINGLE,size:4,color:RULE},
      left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},
      insideHorizontal:{style:BorderStyle.SINGLE,size:2,color:"D9D9D9"},insideVertical:{style:BorderStyle.NONE}},
    rows:rows.map((r,ri)=>new TableRow({tableHeader:head&&ri===0,
      children:r.map((c,i)=>cell(c,i,head&&ri===0))}))});
}
// Read a PNG's real pixel dimensions from its IHDR chunk, so a figure is always
// placed at its own aspect ratio. Hard-coding heights lets a regenerated figure
// come out stretched or squashed without anyone noticing.
function pngSize(file){
  const b=fs.readFileSync(file);
  return {w:b.readUInt32BE(16), h:b.readUInt32BE(20)};
}
function fig(file,cap,w){
  const s=pngSize(file), h=Math.round(w*s.h/s.w);
  return [new Paragraph({spacing:{before:160,after:60},alignment:AlignmentType.CENTER,
      children:[new ImageRun({type:"png",data:fs.readFileSync(file),transformation:{width:w,height:h}})]}),
    new Paragraph({spacing:{after:160},alignment:AlignmentType.CENTER,
      children:[new TextRun({text:cap,font:"Times New Roman",size:17,color:GREY})]})];
}

const doc=new Document({
 creator:"Vaibhav Sharma; Sundaravalli Narayanaswami",
 title:"AirResilience: a configurable simulator for disruption propagation in airline operations",
 numbering:{config:[{reference:"b",levels:[{level:0,format:"bullet",text:"\u2022",
   alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:300,hanging:180}}}}]}]},
 styles:{default:{document:{run:{font:"Times New Roman",size:20}}}},
 sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1440,bottom:1440,left:1440}}},
  footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,
    children:[new TextRun({children:[PageNumber.CURRENT],font:"Times New Roman",size:17,color:GREY})]})]})},
  children:[

new Paragraph({spacing:{after:100},alignment:AlignmentType.CENTER,
  children:[new TextRun({text:"AirResilience: a configurable simulator for disruption propagation in airline operations",
    font:"Times New Roman",size:30,bold:true,color:NAVY})]}),
new Paragraph({spacing:{after:60},alignment:AlignmentType.CENTER,
  children:[T("Sundaravalli Narayanaswami",{size:20}),T("*",{size:20,superScript:true}),
            T(", Vaibhav Sharma",{size:20})]}),
new Paragraph({spacing:{after:40},alignment:AlignmentType.CENTER,
  children:[I("Indian Institute of Management Ahmedabad, Vastrapur, Ahmedabad 380015, India")]}),
new Paragraph({spacing:{after:220},alignment:AlignmentType.CENTER,
  children:[T("* Corresponding author. E-mail addresses: "+CORRES+" (S. Narayanaswami), "+EMAIL2+" (V. Sharma).",{size:17,color:GREY})]}),

new Paragraph({spacing:{after:80},children:[B("Abstract")]}),
P([T("When an airline is disrupted, the flights it loses are mostly not the flights that were hit: an aircraft stuck at the wrong airport cannot fly its next four sectors, and a crew out of legal hours cannot simply be replaced. AirResilience is a discrete-event simulator built to study that propagation. It is driven entirely by configuration: network, fleet, crew and schedule are described in a file, and duty-time regulations are declarative data rather than code, so modelling a different carrier or regulator is a configuration change. Aircraft position and crew legality carry across days, which is what lets a bad day become a bad week. Every run is written to a portable trace recording where each parameter came from, and a browser viewer renders any trace. Calibration, exact Shapley attribution and robustness sweeps are included. Against 74,000 flights of published operations data the simulator reproduces the propagation observed in ordinary weather disruption with no parameter fitted. It accounts for only a twelfth of the flights lost in a major carrier meltdown, and we show why that is the correct result: those losses followed from an inability to reassign crews rather than a shortage of lawful crew hours, which a model of operating capacity cannot represent.")],{after:140}),
new Paragraph({spacing:{after:200},children:[B("Keywords: "),
  T("discrete-event simulation; resilience; disruption propagation; crew scheduling; duty-time regulation; reproducibility")]}),

new Paragraph({spacing:{after:80},children:[B("Code metadata")]}),
tbl([
 ["Nr.","Code metadata description","Value"],
 ["C1","Current code version",VERSION],
 ["C2","Permanent link to code / repository used for this code version",REPO],
 ["C3","Permanent link to Reproducible Capsule",DOI],
 ["C4","Legal Code License","MIT"],
 ["C5","Code versioning system used","git"],
 ["C6","Software code languages, tools, services used","Python 3.10+, JavaScript (ES2020)"],
 ["C7","Compilation requirements, operating environments & dependencies","Linux, macOS, Microsoft Windows; Python 3.10 or later. No compilation step. The engine, trace format and viewer require only the standard library. PyYAML optional for YAML configuration files; any modern browser for the viewer"],
 ["C8","Link to developer documentation / manual",REPO+"#readme"],
 ["C9","Support email for questions",EMAIL],
],[0.07,0.40,0.53]),

H1(1,"Motivation and significance"),
P("An airline schedule is a tightly coupled system [1]. An aircraft that fails to reach an outstation cannot operate the return, and everything behind it on that tail is stranded with it. A crew that reaches its legal duty limit cannot be replaced unless standby was rostered in advance. An aircraft that finishes the evening away from base starts the next morning there. The flights an airline loses are therefore mostly not the flights that were hit, and the distinction matters because the two call for different remedies. Damage that is mostly propagation is reduced by recovery capacity: standby crew, spare aircraft, the ability to reposition overnight. Damage that is mostly the initial shock is not, and is reduced only by limiting exposure to the shock itself, whether that means schedule padding, a slower transition to a new regulation, or fewer flights planned into a fog season."),
P("Separating them requires counterfactuals, which the published record cannot supply: it shows what happened, not what would have happened with more standby crew or with rosters rebuilt before a rule change took effect. Simulation can. Airline disruption management is a well developed field, in which recovery of aircraft, crew and passengers has been formalised, surveyed and extended with large-scale optimisation and learning methods [2-7], and network recoverability studied as a property in its own right [8]. What is scarce is software anyone else can reuse: published models are typically written for one carrier, one regulator and one study, with the parameters compiled into the source, so they are hard to apply elsewhere and harder to check [3]."),
P("Three design commitments follow, and they are what this software contributes."),
BUL([B("Regulations are data. "),T("Duty limits, rest, rolling caps and night restrictions are declared in configuration and evaluated by a generic rule engine. Modelling a different authority, or a collective agreement, does not touch the code.")]),
BUL([B("Runs are recorded, not just summarised. "),T("Each run writes a trace of every leg, event and parameter, labelled by where it came from, so a reader can separate evidence from modelling choice.")]),
BUL([B("Analysis is part of the tool. "),T("Calibration, attribution and robustness sweeps ship with the engine, with the safeguards each needs built in rather than left to the user.")]),
P("Nothing in the engine is tied to a network shape. A hub returns everything to one base each evening; a point-to-point network leaves resources spread across many. They propagate disruption differently, the same engine runs both from configuration alone, and a recovery policy tuned on one does not transfer to the other."),

H1(2,"Software description"),
H2("2.1","Architecture"),
...fig("figures/fig1_architecture.png","Figure 1. Configuration, a rule set and a schedule enter; a trace leaves. The dashed return path is overnight carry-over, which makes a week different from seven independent days.",500),
P([T("An experiment is a network, a fleet, a crew pool, a rule set, a schedule and a policy. Schedules are read from CSV or generated for a hub. Rostering groups each resource's legs into duties respecting the planning cap; a tighter cap yields shorter duties and more of them for identical work, a consequence of regulatory change knowable before any disruption.")]),
P("Each day, legs are considered in scheduled-departure order and asked four questions: is the resource in position; when can it actually start; will the crew still be legal on arrival; and if not, is standby cover available. Delay accumulates from the previous leg, from weather conditions defined in configuration, and from a congestion feedback term proportional to the share of the day already disrupted; without that term a heavily disrupted day appears to grow more punctual as it loses flights."),
P("At the end of each day, readiness resets but position does not. A limited number of resources can be repositioned overnight; the remainder start the following morning where they finished. Two independent random streams, one for schedule generation and one for operational noise, are consumed in fixed order, so a configuration and seed always reproduce the same run."),
P([T("A configuration is a single YAML or JSON file. The rule language, the configuration schema and both configurations used in Section 3 are documented and distributed with the software [9], as "),C("configs/indigo_bom.yaml"),T(" and "),C("configs/example_p2p.yaml"),T(". A rule set declares duty caps, leg limits, rest, rolling windows, night restrictions and weekly rest; any field left unset is not enforced, so a partial description of an authority is a valid one.")]),
H2("2.2","Functionalities"),
tbl([
 ["Component","Provides"],
 ["Rule engine","Declarative duty caps, leg limits, minimum rest, rolling windows, night penalties with independent early-start and late-finish triggers, weekly rest, roster headroom"],
 ["Simulator","Multi-day execution with position and legality carry-over, standby callout, overnight repositioning, configurable disruption conditions"],
 ["Trace format","Portable JSON record with a strict validator; parameter provenance; metrics recomputed from legs so runs from different engines remain comparable"],
 ["Viewer","Browser renderer opened from a local file: animated network playback, rotation charts, within-day divergence, side-by-side comparison of two traces"],
 ["Calibration","Targets with tolerances, weighted objectives, grid and random-restart search, held-out targets, refusal of under-determined fits, truncation reporting"],
 ["Analysis","Replication with confidence intervals, exact Shapley attribution, structural sweeps with refitting"],
],[0.22,0.78]),
P([T("Simulation and rendering are separate: the engine writes a trace, the browser only draws one. A trace is a complete and self-contained record of a run, readable, checkable and replayable without the simulator that produced it.")]),

H1(3,"Illustrative examples"),
H2("3.1","An airline hub under regulatory change"),
P([T("India's Directorate General of Civil Aviation revised its flight duty time limitations in 2024, lengthening pilots' minimum weekly rest from 36 to 48 hours and reducing permitted night landings. The second of two phases took effect on 1 November 2025 [10]. In the first week of December 2025 IndiGo, which carries about two thirds of Indian domestic traffic, cancelled several thousand flights, while other carriers under the same rules did not. The regulator recorded that the airline had underestimated the crew needed under the second phase and was flying a roster planned under the previous limits [11].")]),
P("The demonstration configuration reproduces that situation: a timetable planned under one set of duty limits and operated under a tighter set, with no opportunity to re-roster. It is a stylised hub of 40 aircraft over one week, using a generated timetable and a reconstructed rule set rather than the operator's own, so the figures illustrate the mechanism rather than measure the airline. Two parameters, the effective reduction in the duty cap and the strength of the congestion feedback, are fitted jointly to four published observations: daily on-time performance for the first three days, and the cancellation rate recorded at the hub airport across the week. The remaining four days are held out and score the fit, as Figure 3(a) shows."),
...fig("figures/fig2_viewer.png","Figure 2. The viewer comparing two policies on one day. Above, network playback and rotation charts; below, cumulative cancellations against the clock. The lines coincide all morning and separate once delay has pushed crews past their limits.",470),
P([T("Averaged over 20 generated schedules the calibrated case loses 25.9% of the week's legs against 28.5% observed. Of those, 131 are lost directly to crews reaching their limits and 384 to aircraft left out of position: a cascade multiplier of 3.9x, meaning roughly three further flights lost behind every flight lost to the rule change itself. Figure 3(b) shows the response to recovery capacity, with 12% standby cover reducing cancellations to 7.4% under an identical shock.")]),
...fig("figures/fig3_validation.png","Figure 3. (a) Calibration against published punctuality; the band is one standard deviation across 20 schedules, and days 4 to 7 were held out. (b) Cancellations against rostered standby, all else held.",500),
H2("3.2","A point-to-point network"),
P([T("Many carriers do not operate a hub, and the difference is not cosmetic. A second configuration flies a point-to-point European mesh with eight bases, reading its timetable from a file rather than generating one. Because resources end the day spread across the network, a displaced aircraft strands a different set of legs and standby cover must be held in more places to do the same work. Figure 4 shows the week under no standby and under 15% standby: cancellations fall from 2.1% to zero, but that cover is spread across eight bases rather than concentrated at one, a trade a hub operator does not face.")]),
...fig("figures/fig4_topologies.png","Figure 4. The point-to-point mesh on its worst day under two recovery policies: no standby cover (left), which loses 7.1% of that day's departures, and 15% standby (right), which loses none. Ring size shows cancelled departures at each base; blue marks a standby callout.",500),
H2("3.3","Attribution and robustness"),
P([T("Both analyses here run on the hub configuration of Section 3.1, where four causes act together: the tightened duty limits, a roster not replanned before they took effect, the absence of standby cover, and that week's weather. Interacting causes cannot be scored one at a time. Figure 5(b) shows why: the rule change alone produces a 6.9% week and adding the un-replanned roster takes it to 20.4%, yet withdrawing standby from an operation that had replanned costs under half a point. Shapley values, exact and independent of the order causes are considered in [12], assign 55% of the escalation to the rule change, 32% to the roster, 9% to the absence of standby and 4% to weather. The split is a property of this configuration, not of the software.")]),
...fig("figures/fig5_attribution.png","Figure 5. (a) Shapley decomposition of the escalation over four interacting causes. (b) Selected coalitions; a cause that is almost harmless alone can dominate in company.",500),
P([T("Structural sweeps address a different question: how much of a result survives the assumptions that produced it. Each variant of an uncertain modelling choice is refitted to the same observed target before being compared, so that agreeing with the record confers no advantage on any one variant. Across every variant tested the cascade multiplier stays between 3.3x and 4.5x. The crew establishment, meaning the number of crews per aircraft the operation is assumed to hold, moves a great deal over the same variants, because it is not measured but inferred from where the threshold for compliance is placed, and each variant places it differently. The multiplier is therefore a property of the propagation mechanism and can be reported as a result; the establishment is an artefact of one construction and should not be.")]),

H2("3.4","Validation against real operations"),
P([T("Sections 3.1 to 3.3 use generated timetables. To test the propagation mechanism against real operations we ingested US Bureau of Transportation Statistics On-Time Performance data [13] for Southwest Airlines across three periods in December 2022 and January 2023, about 74,000 flights. The dataset records the tail number of every flight, so an aircraft's rotation can be reconstructed exactly rather than assumed.")]),
P([B("The test is deliberately narrow. "),T("No public dataset records which crew worked which flight, so crew legality cannot be checked against observation and the crew layer is disabled. What remains is aircraft displacement, which the data adjudicates exactly. Cancellations BTS attributes to weather or airspace are treated as given and handed to the simulator, which propagates their consequences; cancellations attributed to the carrier are the comparison, since those are what an airline's own recovery prevents or fails to prevent. "),B("Nothing is fitted, and that is the point. "),T("The model receives a schedule and a set of injected cancellations and nothing else, and the propagation count follows from the rotation structure alone. No parameter exists that could be adjusted to improve the agreement, which we confirm by sweeping every free parameter and observing that the result does not move. What follows is a prediction, not a description.")]),
tbl([
 ["Period","Legs","Weather injected","Model propagates","Observed carrier"],
 ["1-7 Dec 2022, calm","25,707","14","0 (0.00%)","45 (0.18%)"],
 ["12-18 Jan 2023, weather","25,015","305","61 (0.24%)","43 (0.17%)"],
 ["22-28 Dec 2022, meltdown","23,538","1,989","751 (3.19%)","9,296 (39.49%)"],
],[0.30,0.14,0.19,0.19,0.18]),
...fig("figures/fig6_validation_bts.png","Figure 6. (a) Modelled propagation against observed carrier-coded cancellations, log scale, nothing fitted. (b) Duty limits enabled and crew establishment swept; the observed level is unreachable at any plausible value.",500),
P([T("On ordinary disruption the mechanism holds. In the January weather week the simulator propagates 61 cancellations where 43 carrier-attributed ones occurred across 25,015 flights; in the calm week both are near zero. In the December meltdown it produces 751 against 9,296 observed, short by a factor of twelve.")]),
P([B("The gap is the more informative half of the result. "), T("Switching the crew layer back on and sweeping the establishment lifts the modelled total from 3.2% to 8.8%, and reaching the observed 39.5% would require roughly 1.3 crew units per aircraft, far below anything plausible for a major carrier. The meltdown therefore cannot be reproduced as a shortage of lawful crew hours, whatever the parameters are set to. The carrier's own account agrees: in testimony to the US Senate Commerce Committee its chief operating officer described a volume and frequency of required crew schedule changes that overwhelmed the airline's crew scheduling processes and technology, leaving crews present and legal but unreachable by the system meant to reassign them [14]. "),B("What failed was the allocation of capacity rather than the capacity itself, and a model of capacity cannot represent that.")]),
P([T("The two disruptions look alike from outside, both being an airline cancelling thousands of flights in a week, but they differ in kind. The Indian carrier's December 2025 cancellations, modelled in Section 3.1, are a capacity failure: lawful crew hours ran out, and the model reproduces the loss. The December 2022 meltdown examined here is an allocation failure: the hours existed and could not be assigned, and the model does not. The two call for different remedies, and a simulator that reproduced both alike would be no help in telling them apart.")]),
H1(4,"Impact"),
P("The software makes a class of study cheaper to run. How much standby crew is worth its cost, and what a tightening of duty limits would do to a published timetable, are questions that arise for every airline subject to such regulation, and are usually answered by building a model for the occasion that nobody outside the team can rerun. Here they are a configuration file and a command."),
P("A trace is the durable output. It records every leg, event and parameter of a run in a documented JSON format with a strict validator, labelling each parameter as sourced, calibrated, assumed, derived or user-supplied, so a reader can see which numbers were evidence and which were choices. Because the viewer opens a trace directly in a browser, a run can be archived alongside an article and inspected years later by someone who has neither the engine nor a Python installation. The format is specified rather than internal, so a group running its own simulator can emit traces and use the viewer and analysis tools on them."),
P("The analysis layer enforces practices that are widely agreed on and often skipped [15]. Calibration refuses to run when free parameters outnumber independent targets, since any fit would then be arbitrary. Targets marked as held out are excluded from the objective and scored after fitting, so the reported error is out of sample. A search that exhausts its budget is flagged as truncated rather than reported as converged. Structural sweeps refit each variant to the same targets before comparing, so a variant gains nothing from agreeing with the record."),
P("The model can also bound what it cannot explain. Because the propagation calculation is structural and admits no tuning, the difference between the loss it predicts and the loss an operator sustained is itself a quantity: a carrier whose disruption exceeds what displacement and duty limits account for has a problem elsewhere, and the gap bounds its size. Section 3.4 is one instance. Beyond research use, the software suits analysts assessing a regulatory change before it takes effect, and teaching, where a cascade that can be steered by editing one line of a configuration is easier to convey than one described."),

H1(5,"Conclusions"),
P("AirResilience makes disruption-propagation studies configurable, inspectable and reusable, and the same engine runs an airline hub and a point-to-point network without modification."),
P([T("Two limitations bound the claims. The hub case of Section 3.1 uses a generated timetable and a reconstructed rule set, so its figures illustrate a mechanism rather than measure an operator; and the test against real data covers aircraft displacement only, since no public dataset records crew assignment, so crew legality is implemented but unchecked against observation.")]),
P([T("The clearest extension follows from Section 3.4: the engine assumes a crew that is legal and available is assigned, and a constraint on how many reassignments an operator can process in a given period would let it cover allocation failures as well as capacity ones. Further work includes individual rather than pooled crew modelling, multi-day pairings for long-haul operations, maintenance constraints and passenger-level outcomes.")]),

new Paragraph({spacing:{before:200,after:80},children:[B("Verification and reproducibility")]}),
P([T("Two test suites ship with the software and run without installing anything beyond Python. A regression suite compares the engine against a fixed reference implementation of the hub case across 20 scenarios spanning four seeds, three standby levels, both roster modes and two rule sets, checking 40,040 legs on state, cause and realised departure time; agreement is exact. A unit suite of 40 cases covers the trace validator, configuration checks, the rule engine, CSV ingest, topology independence, engine invariants, the calibration guardrails of Section 4 and the exactness of the Shapley decomposition. Both run in continuous integration on Python 3.10 to 3.13. The datasets used in Section 3.4 ship with the software, so every result and figure in this article can be regenerated from the configurations provided [9].")]),

// CRediT taxonomy: https://credit.niso.org/ . Roles below are a first pass and
// need both authors to confirm before submission.
new Paragraph({spacing:{before:200,after:80},children:[B("CRediT authorship contribution statement")]}),
P([B("Sundaravalli Narayanaswami: "),T("Conceptualization, Methodology, Supervision, Writing - review & editing. "),
   B("Vaibhav Sharma: "),T("Conceptualization, Methodology, Software, Validation, Formal analysis, Investigation, Data curation, Visualization, Writing - original draft.")]),

new Paragraph({spacing:{before:200,after:80},children:[B("Declaration of competing interest")]}),
P("The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper."),

new Paragraph({spacing:{before:200,after:80},children:[B("Data availability")]}),
P([T("The On-Time Performance data analysed in Section 3.4 is published by the US Bureau of Transportation Statistics [13]. The extracts, derived schedules and exogenous cancellation sets are redistributed in the archived release [9] with all configurations and figure scripts, so every result here can be reproduced without downloading the source data.")]),

// Acknowledgements are optional. If the course-project group members are to be
// credited for the original case study, this is where that belongs; naming them
// here also makes clear why they are not authors of the software.
// new Paragraph({spacing:{before:200,after:80},children:[B("Acknowledgements")]}),
// P("The IndiGo case study began as a group project on the operations strategy course at the Indian Institute of Management Ahmedabad. The authors thank NAMES for their contribution to that original analysis."),

// Elsevier requires this section immediately above the references whenever
// generative AI was used in the writing process, naming the tool, the purpose
// and the extent of author oversight. Basic grammar and spelling checks are
// exempt and need no declaration. Use of AI in the research or development
// process rather than the writing belongs in the software description instead.
// The authors must confirm the wording below before submission.
new Paragraph({spacing:{before:200,after:80},children:[B("Declaration of generative AI and AI-assisted technologies in the writing process")]}),
P([T("During the preparation of this work the authors used "),B("[TOOL NAME AND VERSION]"),T(" in order to "),B("[PURPOSE]"),T(". After using this tool the authors reviewed and edited the content as needed and take full responsibility for the content of the published article.")]),

new Paragraph({spacing:{before:200,after:80},children:[B("References")]}),
P([T("[2] Clausen J, Larsen A, Larsen J, Rezanova NJ. Disruption management in the airline industry: concepts, models and methods. Computers & Operations Research 2010;37(5):809-821. https://doi.org/10.1016/j.cor.2009.03.027")],{after:60,align:AlignmentType.LEFT}),
P([T("[3] Hassan LK, Santos BF, Vink J. Airline disruption management: a literature review and practical challenges. Computers & Operations Research 2021;127:105137. https://doi.org/10.1016/j.cor.2020.105137")],{after:60,align:AlignmentType.LEFT}),
P([T("[4] Kohl N, Larsen A, Larsen J, Ross A, Tiourine S. Airline disruption management: perspectives, experiences and outlook. Journal of Air Transport Management 2007;13(3):149-162. https://doi.org/10.1016/j.jairtraman.2007.01.001")],{after:60,align:AlignmentType.LEFT}),
P([T("[5] Lettovsky L, Johnson EL, Nemhauser GL. Airline crew recovery. Transportation Science 2000;34(4):337-348. https://doi.org/10.1287/trsc.34.4.337.12316")],{after:60,align:AlignmentType.LEFT}),
P([T("[6] Ball M, Barnhart C, Nemhauser G, Odoni A. Air transportation: irregular operations and control. In: Handbooks in Operations Research and Management Science, vol. 14. Elsevier; 2007, p. 1-67. https://doi.org/10.1016/S0927-0507(06)14001-3")],{after:60,align:AlignmentType.LEFT}),
P([T("[7] Ding Y, Wandelt S, Wu G, Xu Y, Sun X. Towards efficient airline disruption recovery with reinforcement learning. Transportation Research Part E: Logistics and Transportation Review 2023;179:103295. https://doi.org/10.1016/j.tre.2023.103295")],{after:60,align:AlignmentType.LEFT}),
P([T("[8] Lee J, Marla L, Vaishnav P. The impact of climate change on the recoverability of airline networks. Transportation Research Part D: Transport and Environment 2021;95:102801. https://doi.org/10.1016/j.trd.2021.102801")],{after:60,align:AlignmentType.LEFT}),
P([T("[9] Narayanaswami S, Sharma V. AirResilience: configurable simulation of disruption propagation in scheduled operations, version " + VERSION + ". " + DOI + "")],{after:60,align:AlignmentType.LEFT}),
P([T("[10] Directorate General of Civil Aviation, Government of India. Civil Aviation Requirement, Section 7 - Flight Crew Standards, Training and Licensing, Series J Part III: duty period, flight duty period, flight time limitations and prescribed rest periods. Issue III, 24 April 2019, Revision 2, 26 March 2024; phase one effective 1 July 2025, phase two effective 1 November 2025. https://www.dgca.gov.in")],{after:60,align:AlignmentType.LEFT}),
P([T("[11] Directorate General of Civil Aviation, Government of India. Review meeting on IndiGo flight disruptions, 4 December 2025. https://www.newsonair.gov.in/dgca-reviews-indigo-after-major-flight-disruptions/")],{after:60,align:AlignmentType.LEFT}),
P([T("[12] Shapley LS. A value for n-person games. In: Contributions to the Theory of Games II. Princeton University Press; 1953, p. 307-317.")],{after:60,align:AlignmentType.LEFT}),
P([T("[13] US Department of Transportation, Bureau of Transportation Statistics. Airline On-Time Performance Data, Reporting Carrier On-Time Performance (1987-present). https://www.transtats.bts.gov")],{after:60,align:AlignmentType.LEFT}),
P([T("[14] Watterson A. Testimony before the US Senate Committee on Commerce, Science and Transportation, hearing on Southwest Airlines' holiday meltdown, 9 February 2023. https://www.commerce.senate.gov")],{after:60,align:AlignmentType.LEFT}),
P([T("[1] Perrow C. Normal Accidents: Living with High-Risk Technologies. Basic Books; 1984.")],{after:60,align:AlignmentType.LEFT}),
P([T("[15] Wilson G, Aruliah DA, Brown CT, et al. Best practices for scientific computing. PLoS Biology 2014;12(1):e1001745. https://doi.org/10.1371/journal.pbio.1001745")],{after:60,align:AlignmentType.LEFT}),
]}]});
Packer.toBuffer(doc).then(b=>{fs.writeFileSync("AirResilience_SoftwareX.docx",b);
  console.log("written",(b.length/1024).toFixed(0)+"KB");});
