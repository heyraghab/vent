<script>
  import {
    Page,
    Navbar,
    List,
    ListItem,
    Block,
    Button,
    useStore,
    NavRight,
    Link,
    BlockFooter,
    Subnavbar,
    Searchbar,
    f7,
    Icon,
    SwipeoutActions,
    SwipeoutButton,
    BlockHeader,
  } from "framework7-svelte";

  import { db, user } from "../js/gun";
  let req = [];
  let pub;
  let q;

  function search(l) {
    let cert;
    q = l.srcElement.value;
    if (q == "" || !q) {
      return;
    }
    db.get("usernames")
      .get(`#${q}`)
      .once(async (a) => {
        if (a) {
          delete a._;
          pub = JSON.stringify(a).split(':"')[1].split('"}')[0];
          console.log(pub);
          if (pub) {
            db.user(pub)
              .get("alias")
              .once((a) => {
                db.user(pub)
                  .get("online")
                  .once((o) => {
                    let obj = {
                      username: a,
                      pub: pub,
                      onlinestatus: o,
                    };
                    console.log(obj);
                    req = [obj];
                  });
              });
          }
          db.user(pub)
            .get("cert")
            .get("req")
            .once((a) => {
              cert = a;
            });
        }
      });
  }

  async function add(pub) {
    await db.user().get("feed").get(pub).put(true);
    rec = rec.filter((a) => {
      return a.pub !== pub;
    });
    f7.toast
      .create({
        text: "added",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  }

  function sendreq() {
    db.get(`~${pub}`)
      .get("cert")
      .get("req")
      .once((a) => {
        let cert = a;
        db.get(`~${pub}`)
          .get("req")
          .get(user.is.pub)
          .put(
            true,
            () => {
              f7.dialog.alert("sent requests to " + q, () => {
                f7.loginScreen.close();
              });
            },
            { opt: { cert: cert } }
          );
      });
    add(pub);
  }

  let rec = [];
  function load(done) {
    db.user()
      .get("req")
      .map((a, b) => {
        if (a) {
          db.user(b)
            .get("alias")
            .once((a) => {
              db.user(b)
                .get("online")
                .once((o) => {
                  let obj = {
                    username: a,
                    pub: b,
                    onlinestatus: o,
                  };
                  console.log(obj);
                  rec = [obj];
                });
            });
        }
      });

    done();
  }

  function del(u, pub) {
    f7.dialog.confirm("delete request from " + u + "?", (a) => {
      console.log(a);
      console.log("test");
      db.user().get("req").get(pub).put(false);
      rec = rec.filter((a) => {
        return a.pub !== pub;
      });
      f7.toast
        .create({
          text: "deleted",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    });
  }

  load(() => {});
</script>

<Page ptr ptrMousewheel={true} onPtrRefresh={load} name="Requests">
  <Navbar title="Requests">
    <Subnavbar inner={false}>
      <Searchbar
        onChange={search}
        searchContainer=".search-list"
        searchIn=".item-title"
        onSearchbarSearch={search}
      />
    </Subnavbar>
  </Navbar>
  <BlockFooter>
    <div style="text-align: center;">pull to refresh</div>
  </BlockFooter>
  <List>
    {#if req.length > 0}
      <BlockFooter>Send Message Requests</BlockFooter>
    {/if}
    {#each req as r}
      <ListItem
        on:click={sendreq}
        title={r.username}
        footer={r.onlinestatus}
        after=""
      >
        <!-- <img src={m.pfp} slot="media" alt="" /> -->
      </ListItem>
    {/each}
  </List>

  <List>
    <BlockHeader>Received requests (swipe)</BlockHeader>
    {#if rec.length == 0}
      <BlockFooter>no requests!</BlockFooter>
    {/if}
    {#each rec as r}
      <ListItem swipeout title={r.username} footer={r.onlinestatus}>
        <i slot="media" class="icon icon-f7" />
        <SwipeoutActions left>
          <SwipeoutButton
            color="green"
            onClick={() => {
              add(r.pub);
            }}
          >
            <Icon f7="chat_bubble_fill" />
          </SwipeoutButton>
          <SwipeoutButton
            color="red"
            onClick={() => {
              del(r.username, r.pub);
            }}
          >
            <Icon f7="trash" />
          </SwipeoutButton>
        </SwipeoutActions>
      </ListItem>
    {/each}
  </List>
</Page>
