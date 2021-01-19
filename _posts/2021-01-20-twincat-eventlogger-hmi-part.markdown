---
layout: post
title: "TwinCAT EventLogger: HMI part"
date: 2021-01-20
category: twincat
---

In an [earlier article](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html) I introduced the PLC part of the TwinCAT EventLogger and showed some useful features. In this article I will go into the details on how to visualize the events using TwinCAT’s web-based HMI (TE2000). 

*Thanks to [Jakob Sagatowski](https://github.com/sagatowski) for his valuable feedback while writing this article.*

- Code: [PlcPart](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/PlcPart)
- Code: [HmiPart](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/HmiPart)

To follow this tutorial you can either download the completed [HMI project](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/HmiPart) or you can start with the [PLC project](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/PlcPart) from the [previous article](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html). **I'll assume here that you will start with the PLC project part and work your way towards the HMI project.**

## Adding a new HMI project

With the solution from the PLC part open, add a new HMI project by going to **File > Add > New Project**. You should see the following screen. Select **TwinCAT HMI Project** from the TwinCAT HMI menu and give it a name, e.g. *EventGridSample*.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/add_hmi_project.png)

The standard HMI project contains a couple of folders and files. We'll mainly use the **Desktop.view** for this tutorial, which is the default home page.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/default_hmi_project.png)

## Adding the Event Grid

In order to visualize the events, we'll use a standard HMI control from the Beckhoff: the Event Grid. You can find some [general information](https://infosys.beckhoff.com/content/1033/te2000_tc3_hmi_engineering/26698403957888680715.html?id=5204368253031999869) and more detailed information about [the API](https://infosys.beckhoff.com/content/1033/te2000_tc3_hmi_engineering/4724260747.html?id=5870060213399401190) of the Event Grid on InforSys. 

In order to add the Event Grid to an HMI page: open the **Desktop.view** file and then drag the Event Grid into the **Desktop.view** from the **Toolbox** view, as shown below. If the toolbox is not shown, you can activate it via **View > Toolbox**.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/add_event_grid.gif)

The Event Grid Control provides a convenient interface to all past and present events. It has a few buttons in the top row which allow you to:
- filter/show specific event types 
- confirm alarms
- add or remove (custom) columns

I'll show an example with a custom column a bit [further on](#adding-a-custom-column).

## Activating the configuration

Before we can start using our HMI we have to activate our configuration. Select **Activate Configuration** and select **Autostart PLC Boot Project(s)** and click **OK**. Select **OK** in the message box to *Restart TwinCAT System in Run Mode*.

### HMI settings for remote target
I assumed here that you'll run your project locally. However, if you are running your project on a remote target system, please follow these additional instructions here. If your running your project locally, the default settings should do and you can go to the next [section](#sending-messages).

Select a file from the HMI project and go to **TwinCAT HMI > Windows > TwinCAT HMI Server Configuration**. You should see the following screen. Go to the tab **ADS** and make sure the default publishing configuration is selected on the top right. Then under **Runtimes**, select the **AmsNetId** of your PLC and accept the changes.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/ads_runtime_config.png)

Then go to the **TcHmiEventLogger** tab. Again make sure the default publish configuration is selected. Then under **Target Systems > Local**, change the address to the one of your PLC. Accept the changes.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/event_target.png)

## Sending a message

First we'll test our message event. In order to do so, drag a Toggle button from the **Toolbox** into the **Desktop.view** and place it somewhere. Change the button text to e.g. *Send message*. Next we'll link the button to a variable in the PLC. Click on the small square button, circled in red, next to the **StateSymbol** and choose **Create data binding...**.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/send_message_button.png)

You should see the following window. Select the **Server symbols** tab and select `bSendMessage` and click on **Map Symbol**. In the new window, leave the default symbol name and click on **OK**.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/map_symbol.png)

If you now go back to the **Mapped symbols** tab, you can link the variable we just mapped to the button. To do so, select `PLC1.SendMessage.bSendMessage` and click on **OK**.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/link_symbol.png)

### Live view

Now lets see the event logger in action! You can either publish your HMI project to a remote HMI server or use the Live-View. Here I'll use the Live-View since it allows you to see your changes instantly. You can activate the HMI Live-View via **TwinCAT HMI > Windows > TwinCAT HMI Live-View**. You should now see something which looks like the image below. If you click on the "Send Message" button, a new message should appear in the event viewer.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/event_control_with_message.png)

In case you do not see anything, it might be the case that you made a mistake somewhere. If there are errors on the page, this is shown on the toolbar on the top of the Live-View. Click on it to open the Developer tools window. From here you can try to debug what is causing your issues.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/live-view_errors.png)

## Adding the other alarms

Very similarly to how we created a button to send a message, we can now add some more buttons to raise, clear and confirm the other two alarms in the project. For each button I labeled them to which variable in the PLC they are linked.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/all_alarms_annotated.png)

## Adding a custom column

A good feature of the Event Grid is that there are many possibilities to customize it. For example adding another column, which shows the source of the alarm. To add or remove a column, click on the third button from the right.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/EventLoggerHmiSourceNameButton.png)

The following menu is then shown. On the left you see all available columns which can be shown and on the right all the columns which are shown. Now add the **params::** column from the available list. Then on the right for the **Name** enter *params::sourceName* and for the **Label** enter *Source*. Then click on **OK** to exit and you should see an additional column.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/EventLoggerHmiSourceNameSettings2.png)

The newly added column shows the path to the source of the event which can be quite convenient. In this example it doesn’t add that much, since this a very small program. However, if the events were a few function blocks deep, the precise path to the source can be handy to trace the origin of the alarm. Note that, as shown in the [PLC part](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html), you can also customize the source as was done with the second event. For this event the source name was changed to *Water pump 3*. 

![](/assets/2021-01-20-twincat-event-logger-hmi-part/EventLoggerHmiWithSourceName.png)

Another handy column to add to the HMI event overview is called *params::eventClassName*. This will show the Display text of an event class. This column can be handy if you, for example, divided your events into specific event classes for each machine component (e.g. water circuit, conveyor belts, electronics, etc.), and want to sort your events per subsystem of your machine. 

## Pop-ups
The event grid provides a convenient interface for all events. However, it is easy to miss a newly raised alarm. Especially if you have multiple HMI pages, of which maybe not all contain an event grid control. A good way to grab the user’s attention is through pop-ups. 

Pop-ups can be added by adding some JavaScript to the HMI project. In order to do so, right click on the HMI project and go to **Add > New Item....** Then choose **CodeBehind (JavaScript)** and pick an appropriate name. This will add a JavaScript file to your project which already contains some necessary boilerplate in order to make it work with a TwinCAT HMI project. 

![](/assets/2021-01-20-twincat-event-logger-hmi-part/EventLoggerHmiAddingCodeBehind.png)

As an example I added the following code to create the pop-up. First a `composeHtmlPopUpElement` function with a single argument `event` where you can pass the event data to. The event data contains the `event.text` which is placed in a `<div>`. The event data type also holds more information about the event, such as its severity (warning, error or critical) and the time it was raised. Furthermore an OK button is added to acknowledge the pop-up. The OK button removes the top most layer from the HMI, in this case the pop-up itself.
 
```javascript
function composeHtmlPopUpElement(event) {
    return $(
        '<div style="background:white;padding:10px;max-width:400px;">'
        + event.text + '<br><br>'
        + '<button type="button" onclick = '
        + '"var topLayer=document.getElementsByClassName(\'tchmi-in-topmostlayer\');'
        + 'var currentTop=topLayer[topLayer.length - 1];'
        + 'TcHmi.TopMostLayer.removeEx($(currentTop));"> OK'
        + '</button> '
        + '</div>');
}
```

Next I defined a function which is called whenever a new event is raised. The function adds the html pop-up element returned by `composeHtmlPopUpElement()`, to the top most layer of the HMI page. So, each time the function is called, it will place a new layer on top of the previous one. In practice this means that when multiple alarms are raised, a whole stack of layers will be put onto your HMI, where the top most layer is from the most recent alarm.

```javascript
function showPopUp(event) {
    var newPopUp = composeHtmlPopUpElement(event)
    TcHmi.TopMostLayer.addEx(newPopUp, {
        centerHorizontal: true,
        centerVertical: true,
        removecb: (data) => {
            if (data.canceled) {
                // user clicked on the background
                TcHmi.TopMostLayer.removeEx(newPopUp);
            }
        }
    });
}
```

Next I defined a function which is called whenever a certain type of alarm is raised and it gets passed some data about the event. In this example I only want to show a pop-up when an alarm is raised. 

```javascript
function subscriptionCallback(data) {
    // check if the callback object is valid
    if (data.error === TcHmi.Errors.NONE) {
        // check if an event of type alarm is raised
        if (data.changeType === TcHmi.Server.Events.ChangeType.AlarmRaised) {
            showPopUp(data.event);
        }
    }
}
```

Next I made a filter in order to select for the type of events I want to show a pop-up for. In this case I only want to get a pop-up if it is an alarm (warning, error or critical) and is not yet confirmed.

```javascript
let allActiveAlarmsFilter = [
    {
        path: 'type',
        comparator: '==',
        value: TcHmi.Server.Events.Type.Alarm
    },
    {
        logic: 'AND'
    },
    {
        path: 'timeConfirmed',
        comparator: '==',
        value: new Date(null)
    }
];
```

Finally the filter and the callback function get registered, such that they listen for any new alarm which gets raised.

```javascript
TcHmi.Server.Events.registerConsumer(
    allActiveAlarmsFilter,
    {
        subscription: subscriptionCallback
    }
);
```

If you now raise a new warning a pop-up should appear. You might need to rebuild and/or refresh the Live-View in order for this to work.

![](/assets/2021-01-20-twincat-event-logger-hmi-part/PopUp.png)

I hope I gave you a good introduction into the EventLogger, so that you can start experimenting with it yourself. 

Discuss: [Reddit](??).