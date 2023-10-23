<script>
  import { onMount } from "svelte";
  import { getDevice } from "framework7/lite-bundle";
  import {
    f7,
    f7ready,
    App,
    Panel,
    Views,
    View,
    Popup,
    Page,
    Navbar,
    Toolbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListItem,
    ListInput,
    ListButton,
    BlockFooter,
    theme,
  } from "framework7-svelte";

  import capacitorApp from "../js/capacitor-app";
  import routes from "../js/routes";
  import store, { showbar } from "../js/store";

  const device = getDevice();
  // Framework7 Parameters
  let f7params = {
    name: "vent", // App name
    theme: "ios", // Automatic theme detection
    // App store
    store: store,
    // App routes
    routes: routes,

    // Register service worker (only on production build)
    serviceWorker:
      process.env.NODE_ENV === "production"
        ? {
            path: "/service-worker.js",
          }
        : {},
    // Input settings
    input: {
      scrollIntoViewOnFocus: device.capacitor,
      scrollIntoViewCentered: device.capacitor,
    },
    // Capacitor Statusbar settings
    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  };
  // Login screen demo data
  let username = "";
  let password = "";

  function alertLoginData() {
    f7.dialog.alert(
      "Username: " + username + "<br>Password: " + password,
      () => {
        f7.loginScreen.close();
      }
    );
  }

  onMount(() => {
    f7ready(() => {
      // Init capacitor APIs (see capacitor-app.js)
      if (f7.device.capacitor) {
        capacitorApp.init(f7);
      }
      f7.setColorTheme(f7.colors["dark"]);
      // Call F7 APIs here
    });
  });

  import { db, loggedin, user } from "../js/gun";
  import { SEA } from "gun";

  loggedin.subscribe((a) => {
    console.log(a);
  });

  function signIn() {
    db.user().auth(username, password, (a) => {
      console.log(a);
      if (!a.err) {
        loggedin.set(false);
      }
    });
  }

  // user
  //   .get("cert")
  //   .get("inbox")
  //   .once((a) => {
  //     console.log("cert=", a);
  //   });
  // db.get("usernames")
  //   .get("#raghavhei")
  //   .once((a) => {
  //     console.log(a);
  //   });

  function signUp() {
    user.create(username, password, (a) => {
      if (!a.err) {
        user.auth(username, password, async (a) => {
          var data = a.sea.pub;
          var hash = await SEA.work(data, null, null, { name: "SHA-256" });
          db.get("usernames").get(`#${username}`).get(hash).put(a.sea.pub);
          SEA.certify("*", { "#": { "*": "inbox" } }, a.sea, (c) => {
            user
              .get("cert")
              .get("inbox")
              .put(c, (a) => {
                console.log(a);
              });
          });

          SEA.certify("*", { "#": { "*": "req" } }, a.sea, (c) => {
            user
              .get("cert")
              .get("req")
              .put(c, (a) => {
                console.log(a);
              });
          });

          if (!a.err) {
            loggedin.set(false);
          }
        });
      }
    });
  }
  onMount(() => {
    window.addEventListener("focus", () => {
      user.get("online").put("online");
      console.log("online");
    });
    window.addEventListener("blur", () => {
      user.get("online").put("offline");
      console.log("offline");
    });
  });
</script>

<App {...f7params}>
  <!-- Views/Tabs container -->
  <Views tabs class="safe-areas">
    <!-- Tabbar for switching views-tabs -->
    {#if $showbar}
      <Toolbar tabbar icons bottom>
        <Link
          tabLink="#view-home"
          tabLinkActive
          iconIos="f7:house_fill"
          iconMd="material:home"
          text=""
        />
        <Link
          tabLink="#view-catalog"
          iconIos="f7:square_list_fill"
          iconMd="material:view_list"
          text=""
        />
        <Link
          tabLink="#view-settings"
          iconIos="f7:gear"
          iconMd="material:settings"
          text=""
        />
      </Toolbar>
    {/if}

    <!-- Your main view/tab, should have "view-main" class. It also has "tabActive" prop -->
    <View id="view-home" main tab tabActive url="/" />

    <View id="view-message" tab url="/message/" name="message" />

    <!-- Catalog View -->
    <View id="view-catalog" name="catalog" tab url="/catalog/" />

    <!-- Settings View -->
    <View id="view-settings" name="settings" tab url="/settings/" />
  </Views>
  {#if $loggedin}
    <LoginScreen
      class="demo-login-screen"
      opened={$loggedin}
      onLoginScreenClosed={() => {}}
    >
      <Page loginScreen>
        <LoginScreenTitle>vent</LoginScreenTitle>
        <List form>
          <ListInput
            label="Username"
            type="text"
            placeholder="Your username"
            value={username}
            onInput={(e) => (username = e.target.value)}
          />
          <ListInput
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onInput={(e) => (password = e.target.value)}
          />
        </List>
        <List inset>
          <ListButton onClick={signIn}>Sign In</ListButton>
          <ListButton onClick={signUp}>Sign Up</ListButton>
        </List>
        <BlockFooter>
          by using the application, you agree to our terms and conditions
        </BlockFooter>
      </Page>
    </LoginScreen>
  {/if}
</App>
