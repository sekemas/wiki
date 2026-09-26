/**
 * Original seed content for Openpedia.
 *
 * Everything here is written for this project: plain, neutral prose about
 * general subjects, in our own words. No text, no images and no branding is
 * taken from any other encyclopedia.
 *
 * Edit freely — `bun run db:seed` upserts by slug, so changing an entry here and
 * re-running the seed updates the article without creating duplicates.
 */

export type SeedArticle = {
  slug: string;
  title: string;
  summary: string;
  /** Category slugs this article belongs to (see SEED_CATEGORIES). */
  categories: string[];
  /** Markdown. Supports ## / ### headings, lists, quotes, links and [[slug|label]]. */
  body: string;
};

export type SeedCategory = {
  slug: string;
  name: string;
  description: string;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    slug: "astronomy",
    name: "Astronomy",
    description:
      "Observing the sky: the instruments, catalogues and conditions that make careful observation possible.",
  },
  {
    slug: "cartography",
    name: "Cartography",
    description:
      "Maps and charts: how people have recorded where things are, and how those records were made and used.",
  },
  {
    slug: "coffee",
    name: "Coffee",
    description:
      "From green bean to cup, and the places where the drink became a social institution.",
  },
  {
    slug: "lighthouses",
    name: "Lighthouses",
    description:
      "Coastal aids to navigation: their optics, their keepers, and the marks that guide a vessel into harbour.",
  },
  {
    slug: "mycology",
    name: "Mycology",
    description:
      "Fungi and their networks: growth, reproduction and the quiet work fungi do in living and dead wood.",
  },
];

export const SEED_ARTICLES: SeedArticle[] = [
  {
    slug: "celestial-navigation",
    title: "Celestial Navigation",
    summary:
      "Celestial navigation is the practice of working out where you are by measuring the angles of the sun, moon, planets and stars above the horizon, then comparing those measurements with tables that predict where each body should have been at that instant. For roughly four centuries it was the only reliable way to fix a position in mid-ocean, and it is still taught as the fallback when electronic systems fail.",
    categories: ["astronomy", "cartography"],
    body: `## The measurement problem

A navigator cannot see a position directly, so the practice works indirectly. At a known instant a celestial body stands over exactly one point on the Earth's surface. Measuring the angle between that body and the visible horizon puts the vessel somewhere on a circle centred on that point. Repeat the observation with a second body and the two circles cross; the crossing is the fix.

## Instruments

The sextant, refined in the eighteenth century, holds a small mirror arrangement that brings the image of a body down to the horizon, letting the observer read the angle to about a tenth of a minute of arc. Before it came the cross-staff and the mariner's astrolabe. A sextant alone is not enough: the navigator also needs an accurate timepiece and a printed almanac of predicted positions.

## Longitude and time

Latitude is comparatively easy, because the sun's noon altitude depends on how far north or south you are. Longitude is harder, because the Earth turns 15 degrees every hour, so an error of four minutes in time is an error of one degree — some sixty nautical miles at the equator. The problem was eventually solved by mechanical chronometers accurate enough to carry a reference time to sea, and their readings are combined with almanac tables to give a position line.

## Reading a chart

Fixes are plotted on working charts rather than on the ornate sea charts of the past, and the navigator transfers the fix to a [[portolan-charts|chart]] or plotting sheet. Because the sky is the reference, the work depends on the printed lists of stellar positions maintained in [[star-catalogues|star catalogues]].

## Modern practice

Satellite positioning has made the work unnecessary for routine passage, but it has not disappeared. Yachtsmen and naval officers still learn it precisely because it depends on nothing that can lose power, and the technique is the basis of the plotting exercises used in navigation examinations.

## Limitations

Cloud, poor horizon, and a rough sea all degrade accuracy. A sun sight taken from the deck of a small boat may be good to a mile or two at best, which is why coastal pilotage — buoys, daymarks and [[daymarks-and-buoys|aids to navigation]] — remains the method used near land.`,
  },
  {
    slug: "light-pollution",
    title: "Light Pollution",
    summary:
      "Light pollution is the brightening of the night sky, and the general scattering of artificial light into places where it was not wanted, caused by outdoor lighting that is poorly aimed, over-bright or left on when it is not needed. It erases the faint stars from the view of most people living in cities, and it changes the behaviour of animals that evolved to use darkness.",
    categories: ["astronomy", "lighthouses"],
    body: `## Four effects, one cause

Observers usually separate the problem into four parts. Skyglow is the pale haze above a city, caused by light scattered by water droplets and dust in the air. Glare is light aimed toward the eye rather than at the surface it is meant to illuminate. Light trespass is spill beyond the property it was installed for. Clutter is the sheer accumulation of competing signs and lamps. All four come from the same habit: sending light upward and sideways instead of down onto the ground.

## What it costs astronomy

An amateur telescope under a suburban sky may see stars to the fourth magnitude, where a genuinely dark site reveals thousands of fainter stars. Professional observatories therefore sit far from cities and on coasts and mountains where the air is stable, and a few regions have been designated dark-sky reserves in which lighting is regulated rather than merely discouraged. Faint-object work depends on reference lists from [[star-catalogues|star catalogues]] that assume the sky background is dark.

## What it costs wildlife

Many animals navigate by sky and horizon. Hatchling sea turtles move toward the brightest horizon, which for millions of years was the sea and is now often a lit car park. Migrating birds circle illuminated towers, and insects are drawn to lamps in numbers large enough to matter to local food webs. Because the effects compound across a season, small amounts of stray light can have consequences well out of proportion to the energy involved.

## Mitigation

The remedies are unglamorous and cheap: fixtures that cut off light above the horizontal, shields on existing lamps, warmer colour temperatures that scatter less, dimming after a certain hour, and switching off what nobody is using. Ports and [[lighthouse-keeping|lighthouse stations]] have applied the same reasoning for different reasons — a keeper wants the beam seen at sea and not wasted into the sky.

## Measuring it

Because the change is gradual, the most useful records are long runs of the same observation. Citizen-science programmes ask volunteers to count the faintest stars visible in a familiar constellation on clear, moonless nights, and the resulting series shows the sky at many sites losing visibility decade by decade.`,
  },
  {
    slug: "star-catalogues",
    title: "Star Catalogues",
    summary:
      "A star catalogue is an organised list of stars, each with a position and usually a brightness, published so that other people can find the same object again. Catalogues are the common reference behind nearly every practical use of the night sky, from the almanac tables a navigator carries to sea to the faint source lists astronomers use to study the structure of the galaxy.",
    categories: ["astronomy", "cartography"],
    body: `## The first lists

The earliest surviving comprehensive Western list is attributed to Hipparchus in the second century BC, and it reached later readers through Ptolemy's Almagest, which arranged roughly a thousand stars into constellation figures with coordinates and descriptive brightness terms. Similar work was done independently in China and the Islamic world, where the positions were re-measured and the star names translated and extended.

## Names and numbers

Descriptive names are memorable but ambiguous, so catalogues introduced systematic labels. Bayer letters, published in the early seventeenth century, attach a Greek letter to the brighter stars of each constellation; Flamsteed numbers, compiled a century later, run west to east by right ascension. Both schemes are still in use, which is why a single bright star may carry two respectable designations and several popular ones.

## Modern catalogues

Photographic and then electronic surveys enlarged the lists from thousands to millions and then to more than a billion entries. A modern catalogue records position, proper motion, brightness in several colour bands, and often parallax, giving both a direction and a distance. The value of such a list lies in its consistency: because every entry is measured against the same system, catalogues can be compared across decades to detect objects that move or change brightness.

## Uses

The practical uses are broad. Navigators draw sight-reduction tables from catalogues; surveyors tie ground positions to star positions; spacecraft use them for attitude determination. A catalogue is also the terrestrial counterpart of a [[gazetteers|gazetteer]]: both are maintained reference lists whose usefulness depends on stable naming and careful measurement.

## How positions are given

Coordinates are quoted in a frame that must be stated, because the slow wobble of the Earth's axis gradually shifts the whole grid. Catalogue entries therefore name an epoch, and older lists are converted before comparison. Brightness is quoted on a logarithmic magnitude scale, in which smaller numbers mean brighter stars, and it too is tied to a stated filter band.

## Care and upkeep

Catalogue work is cumulative. A list that is not checked degrades: errors propagate into every table derived from it, and a single mistyped digit can send a navigator's plotted line hundreds of miles off. Maintaining one is therefore as much an editorial job as an observational one.`,
  },
  {
    slug: "portolan-charts",
    title: "Portolan Charts",
    summary:
      "Portolan charts are hand-drawn sea charts of the Mediterranean and adjacent waters that appeared in the thirteenth century and remained in use for several hundred years. Their defining feature is a web of straight lines radiating from compass roses, which let a navigator read a bearing between two ports directly off the parchment.",
    categories: ["cartography", "lighthouses"],
    body: `## What they look like

A typical chart is drawn on a sheet of vellum, often about the size of a large book spread, with a coastline outlined and filled with place names written perpendicular to the shore. Across the sea lies a lattice of intersecting lines, and at their centres are compass roses, sometimes a dozen or more on a single sheet. Inland detail is sparse; the charts were made for water, and what lay beyond the coast mattered mainly as a landmark.

## How the lines were used

The radiating lines are rhumb lines: directions of constant bearing. A navigator could lay a straight edge across two ports and read off a course to steer, then estimate the distance from the chart's scale bar and the ship's logged speed. It is important not to overstate the precision — the charts were working documents used with dead reckoning, an estimate that accumulates error with every change of course.

## Construction

The charts show a surprisingly accurate Mediterranean coastline in a period before any systematic survey, and the standard explanation is that their outlines were assembled from many voyages' worth of bearings and distances rather than measured. They carry no mathematical projection; the geometry is a practical compromise that works because the area covered is small enough for the distortion not to matter much.

## Decline and legacy

When ocean voyaging opened routes far beyond the Mediterranean, the limits of the approach became obvious, and charts built on a consistent projection took over. The portolan tradition did not vanish so much as convert: the layout, the place names and the bearings survived inside later printed sailing directions, and the compass rose itself remains on nautical charts and, in simplified form, on every [[mercators-projection|Mercator]] sheet.

## Working with pilotage

Charts were never used alone. Coasting navigators combined them with soundings taken with a lead line, with the sight of land, and with the marks placed on shore. The relationship between the chart and the physical aid is direct: a chart tells you what a [[daymarks-and-buoys|buoy or daymark]] means, and the mark tells you where you are on the chart.`,
  },
  {
    slug: "mercators-projection",
    title: "Mercator's Projection",
    summary:
      "Mercator's projection is a way of drawing the globe on a flat sheet so that any line of constant compass bearing appears as a straight line. Published in 1569 for the use of navigators, it is still the basis of most wall charts and, in a modified form, of the online maps people use every day.",
    categories: ["cartography"],
    body: `## The navigational problem

A navigator who wants to sail from one port to another needs to know a single bearing that can be held for the whole passage. On a globe such a line spirals toward the pole, and drawing it correctly on a flat sheet is not obvious. Mercator's solution was to accept distortion and arrange it deliberately, so that the meridians become evenly spaced vertical lines and the parallels are pushed apart by an amount that grows toward the poles.

## How it works

The trick is that the stretching is applied in both directions by the same amount at every point. Angles are therefore preserved locally: a bearing measured on the chart matches the bearing on the ground, and a straight line drawn between two ports is the course to steer. The cost is that scale varies with latitude, so the same line length means different distances in different parts of the same sheet.

## Distortion

Away from the equator the exaggeration becomes extreme. Landmasses near the poles are drawn far larger than they are: the familiar comparison is that Greenland appears comparable to Africa, when in reality Africa is roughly fourteen times larger in area. Charts for a single ocean, used in the latitudes they cover, keep the error tolerable; a chart of the whole world at this projection does not.

## Reading a Mercator chart

Because distances must be measured against a latitude scale at the same latitude as the leg being measured, careful navigation involves stepping dividers along the side of the sheet rather than using a single printed bar. This is one of the reasons navigation is still taught with instruments rather than by reading numbers off a screen.

## Modern descendants

Most web maps use a variant called Web Mercator, which keeps the convenience of square tiles and straight lines while accepting the same area distortion. The projection is a poor choice for thematic maps, where equal-area alternatives are used instead. Its enduring position comes from the fact that it is the projection that answers a navigator's question, and that need has not gone away — the same need that produced the earlier [[portolan-charts|portolan charts]] and, in modern form, the reference lists in a [[gazetteers|gazetteer]].`,
  },
  {
    slug: "gazetteers",
    title: "Gazetteers",
    summary:
      "A gazetteer is a geographical dictionary: an alphabetical list of places, each with a location and enough description to identify it unambiguously. Gazetteers are the working reference behind maps, censuses, postal systems and place-name studies, and their hardest problem is not coordinates but agreement about what a place is called.",
    categories: ["cartography"],
    body: `## What is in one

A modern gazetteer entry typically gives a name, a type, a position in a stated coordinate system, an administrative unit, and often a population figure or an elevation. Good gazetteers also record variants: historical spellings, transliterations, names in minority languages, and the errors that earlier compilers copied from one another.

## Historical development

Lists of places with coordinates go back to antiquity, when geographic works tabulated settlements against latitude and longitude. A separate tradition of local gazetteers developed in China, where administrative units were described district by district over many centuries, recording boundaries, produce, notable residents and local history. In nineteenth-century Europe national gazetteers became systematic reference works, tied to post offices, parishes and railway stations.

## Naming is the hard part

Two places in different regions may share a name, one place may carry several names, and a name may shift its boundary while keeping its label. Gazetteers handle this with explicit, machine-readable distinctions: a unique identifier per feature, a separate row for each name variant with its language and status, and a rule about which name is to be preferred on a map.

## Use with maps and charts

A gazetteer supplies the label, a map supplies the picture. The pairing is old: a chart of a coast lists the names a navigator will meet, in the same way that a map series is indexed by a list of sheets and places. Both are reference tools kept deliberately dull and complete, in the spirit of an observational [[star-catalogues|catalogue]] rather than an essay, and both are needed before any projection such as [[mercators-projection|Mercator's]] can be turned into a usable sheet.

## Modern practice

National mapping agencies, postal services and international bodies each maintain gazetteers, and large open datasets now publish millions of features under permissive licences. The remaining difficulties are institutional: identifying the same feature across datasets, settling disputed names, and recording when a name stops being used.`,
  },
  {
    slug: "coffee-roasting",
    title: "Coffee Roasting",
    summary:
      "Coffee roasting is the heat treatment that turns green, unpleasantly grassy coffee seeds into the aromatic, brittle beans that can be ground and brewed. Roasting is quick — usually eight to fifteen minutes — and is controlled almost entirely by how much heat is applied and how quickly the bean reaches and passes two audible cracking points.",
    categories: ["coffee"],
    body: `## Green coffee first

A raw coffee bean is a pale, dense seed with a moisture content of roughly ten per cent and almost none of the aromas people associate with the drink. Those aromas are created in the roaster through hundreds of simultaneous reactions, the most discussed being the browning reactions between sugars and amino acids, and a series of changes to the chlorogenic acids that partly control perceived acidity.

## The phases

Roasting proceeds in recognisable stages. The bean dries, losing water as its temperature climbs. It then enters the browning phase, swelling and darkening, and at some point between about 196 and 205 degrees Celsius it makes a sharp, popping sound known as first crack, caused by pressurised gases and steam escaping the bean's structure. Roasters treat the interval after first crack, called development, as the main point of control: enough time and the flavours round out, too little and the cup tastes sharp and underdeveloped.

## Roast levels

Stopping the roast before or soon after first crack gives a light roast, with pronounced acidity and origin-specific flavours and a dense, hard bean. Continuing to a second, quieter crack gives a dark roast with a glossy, oily surface, heavier body and flavours of caramel and smoke, at the cost of losing much of the original character. There is no single correct answer; the same green coffee is roasted differently for filter and for espresso.

## Equipment

A drum roaster tumbles beans in a heated metal cylinder and is the standard in commercial work because it allows fine control over air flow and heat. Fluid-bed roasters lift beans on a current of hot air and transfer heat faster and more evenly. Home roasting is done in small drums, in converted popcorn poppers, or in a pan, and the trade-off is always the same: less mass means faster changes and a smaller margin for error.

## Freshness

A roasted bean begins releasing carbon dioxide immediately and continues for days. That gas gets in the way of even extraction, which is why many brewers let beans rest for a few days after roasting, and why packaging usually includes a one-way valve. Once degassing slows, the main enemy is oxygen, and the practical advice is simply to buy small amounts, store them sealed and away from heat, and grind immediately before brewing — a lesson that matters just as much when coffee is assessed by [[coffee-cupping|cupping]].`,
  },
  {
    slug: "coffee-cupping",
    title: "Coffee Cupping",
    summary:
      "Cupping is the standardised tasting method used to evaluate coffee. By fixing the dose, the grind, the water temperature and the timing, cuppers remove most of the variables that would otherwise make two samples impossible to compare, so that the coffee itself is the only thing left to judge.",
    categories: ["coffee"],
    body: `## Why standardise

Coffee quality depends on dozens of choices: origin, processing, roast profile, ratio, grind and brew time. Any of them can be changed to make a mediocre coffee taste better or a fine one taste worse. Cupping is designed to hold all of them still. When a buyer compares three lots from the same region, the differences that remain are differences in the coffee.

## The protocol

A typical table sets out several identical cups per sample, each charged with a measured dose of coarsely ground coffee and filled with water just off the boil — the widely used industry figures are about eight and a quarter grams per hundred and fifty millilitres at roughly ninety-three degrees. The grounds form a crust on the surface. The cupper smells the dry grounds, then the wet crust, breaks the crust with a spoon and skims off the floating grounds before tasting.

## What tasters record

Standard vocabulary keeps the discussion comparable: fragrance and aroma, acidity, sweetness, body or mouthfeel, flavour, aftertaste, balance and overall impression, with a separate space for defects such as mould, phenol or potato. Tasters slurp from a spoon, which spreads the liquid across the tongue and draws aromatics up the back of the nose, and they often allow the cup to cool, because some acids and sweetnesses are easier to identify at lower temperatures.

## Scoring

Some schemes reduce a cupping to a single number on a hundred-point scale, on which a score above about eighty is treated as specialty-grade coffee. Numbers make trade and comparison convenient, but they compress a great deal: two coffees may score alike while being very different in character, and one may suit a delicate filter brew while the other does better as a concentrated espresso.

## Limits of the method

Cupping is a laboratory technique, not a description of how anyone drinks coffee. It uses a coarse grind and a long steep, and it deliberately exaggerates differences. Brewing methods, roasting choices and even the serving temperature change what a drinker actually gets, which is why a cupping score is an input rather than a verdict. It is a measuring instrument, like the [[coffee-roasting|roast profile]] it is meant to control for, and the two are usually discussed together.`,
  },
  {
    slug: "coffee-houses",
    title: "Coffee Houses",
    summary:
      "Coffee houses are establishments built around a single drink and a shared table, and from the sixteenth century they became important informal institutions — places to read, argue, do business and hear news. Their combination of cheap refreshment and an excuse to linger made them, in several cities, the origin of institutions that still exist.",
    categories: ["coffee"],
    body: `## Origins

Coffee drinking spread from Yemen through the Ottoman Empire, and by the middle of the sixteenth century coffee houses were established in cities such as Mecca, Damascus, Cairo and Istanbul. They were commercial premises offering a bitter beverage, seating, and the company of whoever else came in, and they quickly acquired a reputation for the conversations such a room encourages.

## Europe

The habit reached Europe in the seventeenth century. Oxford had a coffee house by 1650, and London by 1652; Venice, Paris and Vienna followed within a generation. Because a single cup cost about a penny, London coffee houses were nicknamed penny universities, and a customer could spend hours over it, reading the papers provided and picking up news before it appeared in print.

## From tables to institutions

Different trades settled in different houses, and some of those gatherings formalised. Shipowners, merchants and underwriters met at Lloyd's coffee house in London, and the marine insurance market that grew out of those meetings kept the name. The London Stock Exchange traces a similar route from a group of dealers who met in a coffee house in Exchange Alley. Because so much business was done in them, they were also watched: Charles II issued a proclamation in 1675 to close the coffee houses as centres of political talk, and withdrew it within days after public objection.

## Why they worked

Coffee houses were useful because they were neither home nor workplace nor court. They were open to anyone who could pay the price of a cup, they had a regular clientele, and they provided the two things that make an ongoing discussion possible — a table to sit at and a scheduled excuse to come back. The drink itself mattered: coffee is a stimulant, it can be served quickly, and unlike an evening in a tavern it does not end the working day.

## Later forms

During the nineteenth century European cafe culture and the coffee house of the Middle East and North Africa continued along separate lines, one leaning toward literature and the other toward music, board games and long conversations. The late-twentieth-century chain cafe is a different proposition, designed for turnover and takeaway rather than for a fixed set of regulars, but it is still selling the same thing: a reason to be somewhere with other people. The quality of what is served is judged by the methods outlined in [[coffee-cupping|cupping]], and the styles of the drink itself are set by [[coffee-roasting|roasting]].`,
  },
  {
    slug: "lighthouse-lamps",
    title: "Lighthouse Lamps",
    summary:
      "A lighthouse is only as useful as the light it shows, and the history of the lighthouse is largely a history of lamps and optics. Each step — open fires, oil burners with reflectors, concentric prism lenses, acetylene and finally electricity — extended the range at which a mariner could pick a light out of a dark coastline.",
    categories: ["lighthouses"],
    body: `## Open fires and early burners

The earliest tower lights burned wood or coal in an open brazier on the roof, which produced plenty of smoke, a wandering flame, and light that could be seen only a short distance. Better came from burning liquid fuel through a controlled wick. A reflector placed behind the wick sent more of the light seaward, and by the late eighteenth century a parabolic silvered reflector with an argand burner had become the standard arrangement, doubling or tripling useful range.

## The Fresnel lens

The decisive change was optical. A conventional mirror or lens large enough to gather the light of a lamp would have been impossibly thick and heavy, so in the 1820s Augustin-Jean Fresnel designed a compound lens made of concentric rings of prisms that bent light from the lamp into a horizontal beam. The result was a lens that was lighter, cheaper and far more efficient than anything before it, and it turned a modest flame into a beam visible from twenty miles or more.

## Fixed, flashing and the character of a light

With prisms came the ability to give each light a signature. Rotating the optic with clockwork produced a flash each time the beam swept past the observer; placing coloured glass or blank panels in the frame produced patterned flashes and colours. A mariner could therefore identify a station by its character and period alone, without waiting for daylight or a chart note. This is the origin of the printed descriptions that still appear on charts.

## Fuels and electrification

Whale oil gave way to colza, then to mineral oil and, in the late nineteenth century, to acetylene gas, which could be supplied to unattended stations. Electric arc lamps and then filament bulbs replaced flames entirely, and each change reduced the labour of keeping the light lit — a shift that reshaped the station's whole routine.

## Automation

Automation began with the sun valve, which lit the gas at dusk and extinguished it at dawn, and continued through automatic lamp changers and clockwork. Modern stations use sealed-beam units or light-emitting diodes, monitored by radio or satellite. A keepers' craft of wick trimming and lens polishing has been replaced by maintenance schedules — but the design goal is unchanged, and it shares a bias with the campaign against [[light-pollution|light pollution]]: light that goes into the sky or onto the ground beside the tower is wasted, so put it where the mariner is. What the lamp is for is described under [[lighthouse-keeping|keeping a light]].`,
  },
  {
    slug: "lighthouse-keeping",
    title: "Lighthouse Keeping",
    summary:
      "Lighthouse keeping was the work of maintaining a light, its optics and its buildings so that the station showed the correct character every night of the year. It was a job of fixed routines, long isolation and exact record keeping, and it ended in most countries during the second half of the twentieth century as stations were automated.",
    categories: ["lighthouses"],
    body: `## The nightly round

A keeper's night was organised around the light. Before dusk the lamp was lit and the optic checked; through the dark hours the keeper stood watches, trimming wicks or checking the burner, winding the clockwork that turned the lens, and watching for smoke or a flicker. Fog brought extra duty, because a light cannot be seen in thick weather and the station's fog signal had to be sounded instead. Every watch was entered in a logbook with time, weather and anything unusual.

## Day work

Daylight hours were spent on maintenance rather than rest. Brass and glass were cleaned, fuel carried and stored, paint scraped and renewed, the tower and dwellings repaired, stores landed from the relief boat and water collected. Stations were exposed buildings on wet rock and most of the work was simply keeping them weathertight and serviceable.

## Life at the station

Isolation shaped the household. In the nineteenth and early twentieth centuries keepers often lived at the station with their families, and the posting was a whole life rather than a job: schooling for children was improvised or came by correspondence, medical help could be hours or days away, and relief crews arrived on a schedule the weather often broke. Teams were small and had to work together, which is why the service kept records of conduct as well as of lights.

## Organisation

Lighthouse services were usually run by a public board, and they worked to written instructions covering the character of every light, the fuel to be used, the dress and bearing of staff, and the penalties for falling asleep on watch. Inspectors toured stations to check the logs and the state of the equipment. The system was deliberately conservative: a light that was lit without fail for decades was the goal, and changes were introduced slowly.

## Automation

Automatic lamp changers, sun valves and remote monitoring made resident keepers unnecessary, and most services completed the transition in the 1970s and 1980s, leaving keepers only at a few stations. Many towers are now visited for maintenance rather than lived in, and some have become museums. The optics often survive, which is the part of the craft most people can still see — the beam described under [[lighthouse-lamps|lighthouse lamps]], and the marks and buoys of the approach described under [[daymarks-and-buoys|daymarks and buoys]].`,
  },
  {
    slug: "daymarks-and-buoys",
    title: "Daymarks and Buoys",
    summary:
      "Daymarks and buoys are the aids to navigation that work in daylight or at close range, when a lighthouse beam is no help. They mark channels, obstructions and safe water, and they rely less on brightness than on a system of shapes and colours agreed internationally so that a mariner can read them the same way anywhere in the world.",
    categories: ["lighthouses", "cartography"],
    body: `## Marks that are seen by day

A lighthouse is designed for the dark and for distance, but a vessel entering a harbour in clear weather needs guidance at a few hundred metres, not twenty miles. For that purpose coasts carry a range of smaller marks: painted structures, towers and poles with distinctive shapes, and beacons built on rocks or standing in shallow water. Because they are read by daylight, their meaning is carried by silhouette, colour and pattern rather than by light.

## Buoys

Floating buoys carry the same information and can be moved as a channel shifts — the reason they are used for the parts of a waterway that silt or move. A buoy's body colour, its topmark shape and, at night, its light colour and rhythm combine to state its function. Cardinal buoys, for example, are built in pairs of black and yellow cones that indicate which side of the mark the safe water lies on, and the arrangement of the cones encodes the compass direction.

## Two systems

Two colour conventions are in use. Under the region A system, followed in most of the world, the port-hand side of a channel is marked in red and the starboard-hand side in green, when entering from seaward. Under the region B system, used in the Americas together with Japan, the Philippines and Korea, the colours are reversed. The choice of convention is printed on charts, and the position of a mark is given on charts along with its description.

## Lights on buoys

Most buoys also carry a small light, flashing a rhythm that identifies them individually, so that a mark found by day can be recognised at night. The power source is usually a battery or, on larger structures, solar panels, and the unit is sealed against wave action. Because buoys are moored, they are also liable to drag or be struck, which is why their positions are checked regularly and notices of any change are issued to mariners.

## Modern aids

Two additions have changed the picture. Radar reflectors and radar beacons make a mark visible on a vessel's instruments even when a sea mist hides it, and the Automatic Identification System lets larger vessels broadcast their identity and position to one another, supplementing rather than replacing physical marks. Virtual aids, transmitted electronically with no structure in the water, are increasingly used where a physical buoy would be impractical.

## How it fits together

Aids are not a substitute for the chart. The chart tells the mariner what a mark means and where it is expected, whether the source is a [[portolan-charts|historical chart]] tradition or a modern surveyed sheet, and the mark confirms the vessel's position on it. Buoys and beacons, the light in the tower described under [[lighthouse-keeping|lighthouse keeping]], and the printed sailing directions are all elements of one system.`,
  },
  {
    slug: "mycelium",
    title: "Mycelium",
    summary:
      "Mycelium is the vegetative part of a fungus: a branching network of fine tubes called hyphae that grows through soil, wood or another food source, absorbs nutrients from it and, when conditions suit, produces the mushrooms that most people notice. The visible mushroom is only the fruiting body of an organism that may already extend over many metres underground.",
    categories: ["mycology"],
    body: `## Structure

A hypha is a tube a few thousandths of a millimetre across, with a rigid wall and internal partitions in many species. Hyphae branch and fuse, forming a network that explores a volume rather than occupying a point, and the resulting mycelium is the fungus's working body. Growth happens at the tips, which extend into new material while the older parts behind them take up nutrients that the tips release enzymes to unlock.

## Exploring and sharing

Some fungi build cord-like structures in which many hyphae run in parallel, reinforced and protected, forming strands strong enough to cross bare ground and move water and nutrients over metres. These cords explain phenomena such as the rings of darker, faster-growing grass known as fairy rings, where a mycelial front has spread outward over years from a single starting point and depleted one nutrient while releasing another.

## Partnership with plants

The best-known habit of mycelium is partnership. Mycorrhizal fungi colonise plant roots and extend the effective root system far beyond it; the fungus receives sugars the plant has made, and the plant gains access to water and to mineral nutrients, particularly phosphorus, that the fungus can reach more efficiently. The arrangement is ancient and extremely common: the great majority of land plants form some kind of mycorrhizal association.

## Decomposition

The same hyphal network that trades with living roots also dismantles dead ones. Fungi are among the few organisms able to break down lignin, the tough polymer that gives wood its stiffness, and they do it by secreting enzymes into the material around them because the molecules are too large to take in whole. Working through dead wood and leaf litter, mycelium releases nutrients back into circulation, which is the process described under [[forest-decomposition|forest decomposition]].

## Reproduction and dispersal

Fruiting bodies are reproductive structures. When a mycelium has exhausted its food, or when temperature and moisture are right, it concentrates nutrients into a mushroom and produces spores in enormous numbers. Because the mycelium itself is fixed in place and hidden, its continuation depends on those spores travelling elsewhere — the subject of [[spore-dispersal|spore dispersal]].

## Uses

People use mycelium directly and indirectly: as mushrooms for food, as the productive partner in cultivated plants, as a source of enzymes and medicinal compounds, and increasingly as a material that can be grown into blocks, sheets and packaging. Fungi also decompose a wide range of pollutants, which makes some species useful in cleaning contaminated soils.`,
  },
  {
    slug: "spore-dispersal",
    title: "Spore Dispersal",
    summary:
      "Spore dispersal is how fungi get from where they are to somewhere new, since the mycelium that produces them cannot move. A single fruiting body may release billions of spores, and the strategies that carry them away — launch, wind, animals and water — differ in how far they reach and how many spores survive the journey.",
    categories: ["mycology"],
    body: `## Producing the spores

Spores are made on microscopic structures packed into the gills, pores or other surfaces on the underside of a fruiting body, which is why that side is nearly always turned downward and held clear of the ground. Gills and pores are a way of fitting an enormous surface area into a small object: the more surface, the more spores a mushroom can produce, and the numbers are staggering.

## The launch

Many mushrooms do not simply drop their spores but shoot them. A spore sitting on the tip of a supporting cell accumulates a drop of liquid that shifts its centre of mass, and the spore is flung off a few tenths of a millimetre before falling. That tiny launch is enough to clear the neighbouring gill faces, so the spore enters the open air below the cap instead of landing back on the fruiting surface.

## Riding the air

Once free, a spore is carried by whatever air is moving. Air beneath a mushroom cap is warmed and humid, so spores that pass the gills drift outward and downward before being taken by a breeze. The dispersal distances are genuinely large: spores have been recovered from air samples at high altitude and far out over the sea, and the seasonal peaks in airborne fungal spores that allergy sufferers notice are a direct consequence.

## Animals and water

Not every spore travels by air. Truffle-like fungi produce fruiting bodies below ground and rely on animals digging them up and eating them, dispersing spores in dung; some fungi attach spores to insects that visit the fruiting body. Splash from heavy rain spreads spores of species adapted to wet surfaces, and water-borne movement carries spores along rivers and in currents.

## Germination

Landing is only the first test. A spore must reach a suitable food source while conditions are warm and damp enough to germinate, and it must then compete with whatever mycelium already occupies the material — including other individuals of its own species. Most spores fail. That failure rate is the reason for the sheer numbers, and it is also why fungi invest so heavily in producing them.

## What this means for the network

The cycle closes when a germinated spore grows into a new mycelium, either living with plant roots or breaking down dead material as described under [[mycelium|mycelium]] and [[forest-decomposition|forest decomposition]]. Dispersal is what makes each of those roles possible over a landscape rather than at a single point.`,
  },
  {
    slug: "forest-decomposition",
    title: "Forest Decomposition",
    summary:
      "Forest decomposition is the breakdown of dead plant material — fallen leaves, branches, standing dead trees and logs — by fungi, bacteria and animals, which together return the nutrients locked in wood and litter to the soil. It is the other half of the forest's nutrient cycle, and it determines how much carbon a wood stores.",
    categories: ["mycology"],
    body: `## The material problem

Wood is built to resist decay. Cellulose provides tensile strength, and lignin, a complex aromatic polymer, encases and stiffens the cell walls while resisting most enzymes. Freshly fallen wood holds nitrogen and phosphorus that the forest needs, but in forms and proportions that are awkward to release. Decomposition is the slow process of unlocking them.

## Who does the work

Fungi lead on woody material. White rot species attack lignin as well as cellulose, leaving wood pale and soft; brown rot species strip the cellulose and leave a brittle brown residue, which is why dead wood crumbles into cubes rather than collapsing into paste. A large tree trunk is a decades-long project for a succession of species: primary colonisers start in cracks, later species follow through the softer material they leave. Bacteria and invertebrates do much of the mechanical breaking and mixing, and shredding by insects greatly increases the surface available to fungal enzymes.

## The nutrient cycle

As the network of hyphae described in [[mycelium|mycelium]] consumes wood, some nutrients are held in fungal tissue, some are released into the soil solution, and some are transferred into the roots of living trees through mycorrhizal connections. Nitrogen tends to be retained and recycled in place, which means that a forest growing on poor soil depends on its own litter rather than on outside inputs. Remove the dead material from a wood and the following generation grows more slowly.

## Carbon

Because decomposition is slow, dead wood is a store of carbon as well as a source of nutrients. A log on a forest floor may take fifty years to disappear, and during that time its carbon is neither in the atmosphere nor available for new growth. Rates depend on temperature, moisture and the chemistry of the wood, so the same species rots quickly in a warm, wet lowland wood and persists in cold or dry conditions.

## Managing dead wood

Forestry practice once treated dead wood as waste and removed it, which reduced nutrients, removed habitat for insects and cavity-nesting birds and, in many places, left soils compacted and impoverished. Modern practice is retention: leaving standing dead trees, coarse woody debris and a proportion of fallen logs on site. Retention is not the same as neglect — the aim is a supply of material at a range of decay stages, which can support the succession of fungi whose spores arrive through the processes described under [[spore-dispersal|spore dispersal]].

## Studying it

Because the process is slow, ecological study relies on long-running plots where the same logs are measured for decades, and on laboratory work in which a chosen species decomposes a weighed block of known wood. Both approaches are needed: the field shows what happens in a real forest with all its inhabitants, and the laboratory shows what a single fungus can do alone.`,
  },
];
