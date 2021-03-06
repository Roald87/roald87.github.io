---
layout: post
title: "Corona effect on weather"
date: 2020-4-12
category: python
---

During the first Corona wave in March-April 2020 I noticed that was very little cloud cover in Switzerland and the Netherlands. Then I remembered this [article](https://www.nature.com/articles/418601a) where they saw similar effects after 9/11. So I collected weather data and crunched the numbers to see if it was just me or if it really was more sunny than usual.

- [All code](https://github.com/Roald87/CoronaWeather/)
- [Colab weather analyses 🇳🇱](https://colab.research.google.com/github/Roald87/CoronaWeather/blob/master/CoronaWeather_NL.ipynb#)
- [Colab weather analyses 🇨🇭](https://colab.research.google.com/github/Roald87/CoronaWeather/blob/master/CoronaWeather_CH.ipynb#)

✨ *Updated 23 December 2020* ✨

## Netherlands

I analyzed data from the Netherlands and didn't really find a large effect for the temperature differences as they did in the article. However, I did find that it was awfully sunny! Look at the peak in end of March. It was never as sunny before.

![](/assets/2020-04-12-corona-weather/sunhours_nl.png)
Source: [KNMI](https://www.knmi.nl/kennis-en-datacentrum/achtergrond/data-ophalen-vanuit-een-script).

## Switzerland

I also analyzed the data for Switzerland. Here I didn't find such a large peak above normal, although you can see it was quite sunny in early April!

![](/assets/2020-04-12-corona-weather/sunhours_ch.png)
Sources: [Meteo Schweiz historical data](https://data.geo.admin.ch/ch.meteoschweiz.klima/nbcn-tageswerte/nbcn-tageswerte-1864-2018.zip), [2020 data](https://data.geo.admin.ch/ch.meteoschweiz.klima/nbcn-tageswerte/VQEA34.csv)

## Analyses details

For more details see the Jupyter notebooks for [🇳🇱 NL](CoronaWeather_NL.ipynb) and [🇨🇭 CH](CoronaWeather_CH.ipynb) or rerun the notebook in Colab ([🇳🇱 NL](https://colab.research.google.com/github/Roald87/CoronaWeather/blob/master/CoronaWeather_NL.ipynb#) and [🇨🇭 CH](https://colab.research.google.com/github/Roald87/CoronaWeather/blob/master/CoronaWeather_CH.ipynb#)) to see the latest data. 

Note: the Swiss Colab notebook sometimes skips cells. To fix this just run the cells one by one or rerun the ones starting from the one which was skipped. For the Dutch Colab one the plots are often not shown correctly on the first run. Just rerun the plot cells to render them. 
