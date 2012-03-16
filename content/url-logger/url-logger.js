//TODO: Get it working for multiple windows
/* BUGS:
 *
 * When location is changed in non achive window, active window log and tabs log
 * are switch to the window where the location was changed.
 */
if (typeof(urlLoggerChrome) == "undefined") {
    var urlLoggerChrome = {};
}

/* vars */
urlLoggerChrome.logactive;
urlLoggerChrome.activepath;
urlLoggerChrome.logtabs;
urlLoggerChrome.tabspath;
urlLoggerChrome.logall;
urlLoggerChrome.logpath;
urlLoggerChrome.tabRemoveTimeout;

urlLoggerChrome.registerULListener = function ()
{
    urlLoggerChrome.ulXUL.init();
    urlLoggerChrome.ulListener.init();
    window.getBrowser().addProgressListener(urlLoggerChrome.ulListener);
    window.getBrowser().addTabsProgressListener(urlLoggerChrome.ulTabListener);
    window.addEventListener("TabClose", urlLoggerChrome.tabRemoved, false);
}

urlLoggerChrome.unregisterULListener = function ()
{
    urlLoggerChrome.ulXUL.destroy();
    urlLoggerChrome.ulListener.destroy();
    window.getBrowser().removeProgressListener(urlLoggerChrome.ulListener);
    window.getBrowser().removeTabsProgressListener(urlLoggerChrome.ulTabListener);
    window.removeEventListener("TabClose", urlLoggerChrome.tabRemoved, false);
}

urlLoggerChrome.PrefObserver = {
    prefs: null,

    // Initialize the extension
    startup : function () {
		// Register to receive notifications of preference changes
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
					 .getService(Components.interfaces.nsIPrefService)
					 .getBranch("extensions.url-logger.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		this.prefs.addObserver("", this, false);

        urlLoggerChrome.logall = this.prefs.getBoolPref("logall");
        urlLoggerChrome.logpath = this.prefs.getComplexValue("logpath", Components.interfaces.nsILocalFile);
        urlLoggerChrome.logtabs = this.prefs.getBoolPref("logtabs");
        urlLoggerChrome.tabspath= this.prefs.getComplexValue("tabspath", Components.interfaces.nsILocalFile);
        urlLoggerChrome.logactive = this.prefs.getBoolPref("logactive");
        urlLoggerChrome.activepath = this.prefs.getComplexValue("activepath", Components.interfaces.nsILocalFile);
    },

	// Called when events occur on the preferences
	observe: function(subject, topic, data)
	{
		if (topic != "nsPref:changed") return;

		switch(data)
		{
            case "logall":
                urlLoggerChrome.logall = this.prefs.getBoolPref("logall");
                break;
            case "logpath":
                urlLoggerChrome.logpath = this.prefs.getComplexValue("logpath", Components.interfaces.nsILocalFile);
                break;
            case "logactive":
                urlLoggerChrome.logactive = this.prefs.getBoolPref("logactive");
                break;
            case "activepath":
                urlLoggerChrome.activepath = this.prefs.getComplexValue("activepath", Components.interfaces.nsILocalFile);
                break;
            case "logtabs":
                urlLoggerChrome.logtabs = this.prefs.getBoolPref("logtabs");
                break;
            case "tabspath":
                urlLoggerChrome.tabspath = this.prefs.getComplexValue("tabspath", Components.interfaces.nsILocalFile);
                break;
        }
    },

	// Clean up after ourselves and save the prefs
	shutdown: function()
	{
		this.prefs.removeObserver("", this);
	},
}

urlLoggerChrome.ulListener =
{
    QueryInterface : function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },

    init : function()
    {

    },

    destroy : function()
    {

    },

	onLocationChange : function (aWebProgress , aRequest, aLocation)
	{
        urlLoggerChrome.logActive(aLocation.spec);
        urlLoggerChrome.logTabs();
	},

	onStateChange: function(a,b,c,d){},
	onProgressChange: function (a,b,c,d,e,f){},
	onStatusChange: function(a,b,c,d){},
	onSecurityChange: function(a,b,c,d){},
}

urlLoggerChrome.ulTabListener =
{
    QueryInterface : function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },

    init : function()
    {

    },

    destroy : function()
    {

    },

    onLocationChange : function (aBrowser, aWebProgress, aRequest, aLocation, aFlags)
	{
        urlLoggerChrome.logTabs();
        urlLoggerChrome.logAll(aLocation.spec);
	},

	onStateChange: function(a,b,c,d,e){},
	onProgressChange: function (a,b,c,d,e,f,g){},
	onStatusChange: function(a,b,c,d,e){},
	onSecurityChange: function(a,b,c,d){},
    onRefreshAttempted: function(a,b,c,d,e){},
    onLinkIconAvailable: function(a){},
}

urlLoggerChrome.ulXUL =
{
    init : function()
    {
    },

    destroy : function()
    {
    }
}

urlLoggerChrome.openULOptions = function (ev)
{
	window.open("chrome://url-logger/content/options.xul", "", "chrome");
}


urlLoggerChrome.log = function (url)
{
    urlLoggerChrome.logActive(url);
    urlLoggerChrome.logAll(url);
    urlLoggerChrome.logTabs();
}

urlLoggerChrome.logActive = function (url)
{
    if(urlLoggerChrome.logactive)
    {
        var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(urlLoggerChrome.activepath, PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE, 0666, 0);

        stream.write(url, url.length);
        stream.close();
    }
}

/* I/O Open flags
PR_RDONLY  =     0x01
PR_WRONLY  =     0x02
PR_RDWR    =     0x04
PR_CREATE_FILE = 0x08
PR_APPEND  =     0x10
PR_TRUNCATE=     0x20
PR_SYNC    =     0x40
PR_EXCL    =     0x80
*/
urlLoggerChrome.logAll = function (url)
{
    if(urlLoggerChrome.logall)
    {
        var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(urlLoggerChrome.logpath, 0x02 | 0x08 | 0x10, 0666, 0);

        stream.write(url, url.length);
        stream.write("\n", 1);
        stream.close();
    }
}

urlLoggerChrome.logTabs = function (excludelist)
{
    if(urlLoggerChrome.logtabs)
    {
        var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(urlLoggerChrome.tabspath, 0x02 | 0x08 | 0x20, 0666, 0);

        urls = urlLoggerChrome.getTabURLs();
        for(var i = 0; i < urls.length; i++)
        {
            if(typeof(excludelist) != "undefined" && excludelist.indexOf(i) != -1)
                continue;

            stream.write(urls[i], urls[i].length);
            stream.write("\n", 1);
        }
        stream.close();
    }
}

urlLoggerChrome.tabRemoved = function (ev)
{
    urlLoggerChrome.logTabs([ev.target._tPos]);
}


urlLoggerChrome.getTabURLs = function ()
{
    browser = window.getBrowser();
    tabs = browser.browsers;
    urls = [];

    for (var i = 0; i < tabs.length; i++)
    {
        if (typeof(tabs[i]) != "undefined") {
            urls.push(tabs[i].webNavigation.currentURI.spec);
        }
    }

    return urls;
}


window.addEventListener("load", urlLoggerChrome.registerULListener, false);
window.addEventListener("unload", urlLoggerChrome.unregisterULListener, false);
window.addEventListener("load", function (e) { urlLoggerChrome.PrefObserver.startup(); }, false);
window.addEventListener("unload", function (e) { urlLoggerChrome.PrefObserver.shutdown(); }, false);
