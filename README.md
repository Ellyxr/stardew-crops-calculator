<!-- Super big thanks to othneildrew and their contributors for the template! --->
<a id="readme-top"></a>

<br />
<div align="center">
  <a href="https://github.com/Ellyxr/stardew-crops-calculator"> <!-- LOOOL -->
    <img src="/assets/428.png" alt="Logo" width="auto" height="auto">
  </a>

<h3 align="center"> Stardew Crops Calculator</h3>

  <p>
    This tool is designed to help Stardew Valley players maximize their farm profits by calculating earnings from crops, such as crops added by expansion mods or tax mods. Currently, it has an advanced settings for farm configuration with Tax settings on the way (trying to figure out how to do that). 

I wanted to share this to other modded gameplay enjoyers, like me who have 150+ mods with over 7 expansion crops and tax collection, to get the most profits out of a playthrough.
    <br /><br />
    <a href="https://stardew-crops-calculator.vercel.app" target="_blank"> 🌴 Use Calculator 🌴</a>
  </p>
</div>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### 🌾 Crop Calculator  
Add crops using **Single Field** or **Multiple Fields** input modes.  
Enter basic details such as:

- **Crop Name**  
- **Seed Price & Crop Price**  
- **Growth Days & Regrowth Time**  
- **Yield & Category (optional)**  

Only the crop name, prices, and growth days are required. Including yield and category improves accuracy.  Both input types work the same, the difference is in how you input the data!

---

### 🌾 Graph Container  
After submitting crops, they appear on both the **List** and **Graph** sections.  

You can:  
- Hover over any bar to view crop details in the **Crop Details** panel.  
- Toggle **Artisan Goods** to compare processed values.  
- Click **Refresh Graph** if the chart doesn’t auto-update.  
- Adjust farm settings in **Advanced Settings** and click **Submit** to recalculate.

---

### 🌾 List Container  
View and manage all added crops here.  

You can:  
- **Export** your crop list or **Import** it later (no need to re-enter data).  
- **Search** crops in real time.  
- **Edit or Delete** crops directly.  

Editing options:  
- **Delete:** Select one or more rows, then press *Delete*.  
- **Edit yield or category:** Click the value and update it directly.  
- **Edit other details:** Click *Edit*, make changes, then *Save Edit* and close the modal.

---

### 🌾 Crop Details  

Each bar on the graph represents a crop. Hovering over a bar reveals its detailed stats below.

| **Category** | **Name** | **Description** |
|--------------|-----------|-----------------|
| **Harvest Summary** | Total Profit | Gold earned after subtracting seed costs. |
|  | ROI Percent | Return on Investment — higher means more profit per cost. |
|  | Profit per Day | Average daily profit for the season. |
|  | Crops Sold | Number of harvested crops sold. |
| **Crop Quality & Value** | Normal / Silver / Gold / Iridium | Base selling prices per quality tier. |
|  | Expected AVG | Weighted average price factoring fertilizer and farming level. |
|  | Adjusted Value | Average price after rounding or penalty adjustments. |
| **Seed & Sell Prices** | Seed Cost | Gold spent per seed. |
|  | Base Crop Price | Base selling price before bonuses. |
|  | Total Revenue | Combined gold earned from all harvests. |
|  | Total Cost | Total gold spent on seeds. |
| **Growth & Harvest Info** | Growth Days | Days required for the first harvest. |
|  | Harvests per Season | Number of harvests within 28 days. |
|  | Break-Even Point | Harvests needed to recover seed cost. |
|  | Regrows Every | Days between harvests for regrowable crops. |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap
Upcoming Features
- [x] Add Basic Calculation
- [x] Show the highest profit organized from left to right.
- [x] "Edit" and "Delete" will create a pop-up modal that allows the user to freely edit the contents.
- [x] More tooltips for other qualities and types of produce.
- [x] Add Advanced Settings.
- [x] Export list and import said list for better UX.
- [ ] Improve mobile responsiveness.
- [ ] Add option to import and export CSV.
- [ ] Auto-complete feature.
- [ ] Improve UI.
- [ ] Improve Changelog and add How it Works.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

[Codedex] Ellyxr - [@Ellyxr](https://www.codedex.io/@Ellyxr) - ellyxdesigned@gmail.com

[Twitter] Elliex - [@ellyxdesigned](https://x.com/ellyxdesigned)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🌾 Credits

This project would not exist without the inspiration and resources provided by the Stardew Valley community.

- Inspired by [**Stardew Profits**](https://thorinair.github.io/Stardew-Profits/#produce_0-equipment_0-sellRaw_false-sellExcess_false-aging_0-planted_1-maxSeedMoney_0-days_28-fertilizer_0-level_0-season_0-buySeed_false-replant_false-nextyear_false-buyFert_false-average_0-fertilizerSource_0-seeds_(pierre_true-joja_true-special_true)-skills_(till_false-agri_false-arti_false-gatherer_false-botanist_false)-foodIndex_0-foodLevel_0-extra_true-disableLinks_false-byHarvest_false-crossSeason_false-foragingLevel_0)  
  Created by [**Thorinaire**](https://x.com/thorinair_music), a tool I used for years before side-loading modded crops from [**Nexus Mods**](https://www.nexusmods.com/games/stardewvalley). The experience inspired me to build a calculator that supports **custom crops**.  

- Additional resources from the [**Stardew Valley VERY Expanded Collection**](https://www.nexusmods.com/games/stardewvalley/collections/tckf0m?utm_source=site&utm_medium=referral&utm_content=share_button&utm_campaign=share_collectioni) on Nexus Mods.

- **Stardew Valley** and all related assets (such as the background image) belong to [**ConcernedApe**](https://x.com/ConcernedApe).

---

This README was formatted using the [**Best README Template**](https://github.com/othneildrew/Best-README-Template) by *othneildrew*.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vite-url]: https://vite.dev/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 
