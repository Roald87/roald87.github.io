---
layout: post
title: "Forecasting the market share of battery electrical vehicles"
category: python
---

Recently I came across an article where the authors used a relatively simple model to forecast the total installed wind and solar power. I decided to do a similar analyses for the electric vehicle market.

- [Code](https://github.com/Roald87/ev_forecast)

## Model

The model used in the article[^1] works as follows: the quickest way to go from point A (no electric cars) to B (all vehicles are electric) is a straight line. Since you can not suddenly produce a number of electrical vehicles equal to the entire demand of new vehicles, a supply chain for the electric vehicle market has to be build up. Therefore three phases are identified in the model:
1. An _exponential_ growth phase during which the supply chain is build up until its output matches the rate at which products are replaced (as determined by the product lifetime).
2. A _linear_ growth phase during which all old products are steadily replaced by newer counterparts.
3. The _saturation_ phase where the total number of products does not change anymore.

## Results
For the exponential growth phase I used data from the [Global EV Outlook 2017](https://webstore.iea.org/global-ev-outlook-2017)[^2]  and for the linear phase I assumed a vehicle lifetime of 20 years. Based on these assumptions the following result is obtained.

{% picture 2019-ev-forecast/ev_stock_world.png %}

The earliest at which all vehicles in the world can be replaced by electrical ones is **2043**. That is assuming all vehicles which were in the world at 2014 will be replaced by electric vehicles.

### Alternative scenarios

What if:
1. the total amount of vehicles which should be replaced is larger than the current 1.2 billion, say 3 billion: **2044**
2. Or what if the vehicle lifetime is longer, say 30 years: **2052**
3. Or both: **2053**

## Conclusions

Assuming all vehicles will be replaced by electric ones, we have around 4 years of exponential growth of the electrical vehicle market in front of us. Around 2023 linear growth will set in and gradually all internal combustion vehicles will be replaced by electrical ones which will be done by *2044*. Note that although the growth of the market seems impressive on the logarithmic plot, on a linear scale you can see that the electric vehicle market is still very small in 2018 at 0.28%.

Also note that the car lifetime has the largest effect on when all vehicles can be replaced. It would for example be possible to replace all vehicles earlier than 2044, by artificially lowering the lifetime of a car. In other words, incentivize people to demolish their cars and buy and electric one.

[^1]: *Nederlands Tijdschrift voor Natuurkunde* (Dutch Journal of Physics) *Waarom wij wel zonnepanelen maar nog geen kernfusiestroom hebben* (Why we have solar panels but no nuclear fusion power) by Niek Lopes Cardozo, Guido Lange and Gert Jan Kramer (NTvN 83, October 2017, page 350-354)
[^2]: https://webstore.iea.org/global-ev-outlook-2017, table 5 on page 49.
