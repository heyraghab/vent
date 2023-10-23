<script>
  import {
    Page,
    Navbar,
    BlockTitle,
    List,
    ListItem,
    SwipeoutActions,
    SwipeoutButton,
    Icon,
    f7,
  } from "framework7-svelte";
  import { db, user } from "../js/gun";

  let feed = [];

  function load(done) {
    feed = [];
    user.get("feed").map(async (a, b) => {
      await db
        .user(b)
        .get("alias")
        .once(async (a) => {
          await db
            .user(b)
            .get("online")
            .once((o) => {
              let obj = {
                username: a,
                pub: b,
                onlinestatus: o,
              };
              console.log(obj);
              feed = [obj, ...feed];
            });
        });
    });
    done();
  }
  load(() => {});

  function process() {
    feed = feed.filter((obj, index, array) => {
      return index === array.findIndex((item) => item.pub === obj.pub);
    });
  }

  $: feed, process();

  function del(username, pub) {
    f7.dialog.confirm("delete ?", (a) => {
      db.user().get("feed").get(pub).put(false);
      feed = feed.filter((a) => {
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
</script>

<Page ptr ptrMousewheel={true} onPtrRefresh={load} name="home">
  <Navbar title="vent" />
  <List>
    <BlockTitle>Messages</BlockTitle>
    {#each feed as m}
      <ListItem
        link="/message/{m.username}"
        title={m.username}
        footer={m.onlinestatus}
        after=""
        swipeout
      >
        <i slot="media" class="icon icon-f7" />
        <SwipeoutActions right>
          <SwipeoutButton
            color="red"
            onClick={() => {
              del(m.username, m.pub);
            }}
          >
            <Icon f7="trash" />
          </SwipeoutButton>
        </SwipeoutActions>
      </ListItem>
    {/each}
  </List>
</Page>
