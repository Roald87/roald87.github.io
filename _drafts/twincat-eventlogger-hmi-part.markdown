---
layout: post
title: "TwinCAT EventLogger: HMI part"
date: 2021-01-01
category: twincat
---

 In an [earlier article](https://roald87.github.io/twincat/2020/11/03/twincat-eventlogger-plc-part.html) I introduced the PLC part of the TwinCAT EventLogger and showed some useful features. In this article I will go into the details on how to visualize the events using TwinCAT’s web-based HMI (TE2000). 

*Thanks to [Jakob Sagatowski ](https://github.com/sagatowski) for his valuable feedback while writing this article.*

- Code: [HmiPart](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/HmiPart)

Now lets see the event logger in action! First activate the PLC project (**TwinCAT > Activate Configuration**) and then activate the HMI Live-View via **TwinCAT HMI > Windows > TwinCAT HMI Live-View**. You should now see something which looks like the screen shot below. You can click the buttons to send some messages, raise and clear an alarm and they should appear in the event grid control. 

For the HMI part there is a chapter in the hefty 2000+ page [HMI manual](https://download.beckhoff.com/download/document/automation/twincat3/TE2000_TC3_HMI_EN.pdf#bookmark_ID0EIOEEB) (huge pdf alert), plus it contains a link to an [example](https://infosys.beckhoff.com/content/1033/TE2000_TC3_HMI_Engineering/Resources/zip/9007204494484107.zip) project. In this article I’ll use this last example project as a basis and add some extra features. You can find the complete project which I use for this article on [Github](https://github.com/Roald87/TwinCatEventLoggerExample/tree/master/HmiPart).

The event grid control provides a convenient interface to all past and present events. The buttons in the top row allow you to filter for specific event types or confirm all alarms. You can also add or remove columns when you click on the button to which the red arrow points. 

![](/assets/2021-twincat-event-logger-hmi-part/EventLoggerHmiSourceNameButton.png)

After clicking on the button you should see the following menu. On the left you see all available columns which can be shown, and on the right all the columns which are shown. In the screenshot I show a feature which is not as well documented. If you add the **params::** column and then fill in for the **Name** *params::sourceName* and for the **Label** for example *Source* and then click on **OK**, you can see a new column appear!

![](/assets/2021-twincat-event-logger-hmi-part/EventLoggerHmiSourceNameSettings2.png)

The newly added column shows the path to the source of the event which can be quite convenient. In this example it doesn’t add that much value, since we only have one program `MAIN` in which the event function block was initialized. But if the alarm was a few function blocks deep, the precise path of the source can be handy to trace the origin of the alarm. 

![](/assets/2021-twincat-event-logger-hmi-part/EventLoggerHmiWithSourceName.png)

You can also replace the default source name with a custom one (see [manual](https://download.beckhoff.com/download/Document/automation/twincat3/TC3_EventLogger_EN.pdf#bookmark_ID0EABLM) for more details). For that I added a new critical event to the MyEvent class and added the following code to the program variables.

```
fbCritical : FB_TcAlarm;
fbSourceInfo : FB_TcSourceInfo;
bCritical : BOOL;
```

And added the following lines inside the alarm initializer block:

```
fbSourceInfo.Clear();
fbSourceInfo.sName := 'Water pump 3';
fbCritical.CreateEx(TC_EVENTS.MyEvents.Panic, TRUE, fbSourceInfo);
```

And these lines in order to raise the newly defined alarm.

```
IF bCritical THEN
    bCritical := FALSE;
    fbCritical.Raise(0);
END_IF
```

These changes are included in the project on my Github page. If you then change `bCritical` variable to `TRUE` an event should be raised and you should see ‘Water pump 3’ as the Source name in the HMI.

Another handy column to add to the HMI event overview is called *params::eventClassName*. This will show the Display text of an event class. This column can be handy if you, for example, divided your events into specific event classes for each machine component (e.g. water circuit, conveyor belts, electronics, etc.), and want to sort your events per subsystem. 

## Pop-ups
That is all well and good and works most of the time. However, it is easy to miss a newly raised alarm. Especially if you have multiple HMI pages, of which maybe not all contain an event grid control. A good way to grab the user’s attention is through pop-ups. 

Pop-ups can be added by adding some JavaScript to the HMI project. In order to do so, right click on the HMI project and go to **Add > New Item....** Then choose **CodeBehind (JavaScript)** and pick an appropriate name. This will add a JavaScript file to your project which already contains some necessary boilerplate in order to make it work with a TwinCAT HMI project. 

![](/assets/2021-twincat-event-logger-hmi-part/EventLoggerHmiAddingCodeBehind.png)

As an example I added the following code. See the [manual](https://download.beckhoff.com/download/document/automation/twincat3/TE2000_TC3_HMI_EN.pdf#bookmark_ID0EURHQD) for details. First the `composeHtmlPopUpElement` function returns a piece of html code which generates a box. The box is filled with the event text which is obtained from the event data input argument. The event data type also holds more information of the event, such as the severity (warning, error or critical).  Furthermore an OK button is added to acknowledge the pop-up. You can of course adjust the pop-up as you want, by adding an image or the time the alarm was raised.
 
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

Next I defined a function which is called whenever a new event is raised. The function adds the html pop-up element, I defined above, to the top most layer of the HMI page. So each time the function is called it will place a new layer on top of the previous one. In practise this means that when multiple alarms are raised, a whole stack of layers will be put onto your HMI, where the top most layer is from the most recent alarm.

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

Next I define a function which is called whenever a certain type of alarm is raised and it gets passed some data about the event. In this example I only want to show a pop-up when an alarm is raised. 

```javascript
function subscriptionCallback(data) {
    // check if the callback object is valid
    if (data.error === TcHmi.Errors.NONE) {
        // check if the alarm type is raised
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

If you now raise a new warning a pop-up should show. You might need to rebuild and/or refresh the Live-View in order for this to work.

I hope I gave you a good introduction into the EventLogger, so that you can start experimenting with it yourself. Let me know what your experiences are and if you’ve come across any issues.

![](/assets/2021-twincat-event-logger-hmi-part/PopUp.png)

Discuss: [Reddit](??).