<script>
    export let username;
    let userstatus;
    let pub;
    let cert;
    import { onMount } from "svelte";
    import {
        f7,
        f7ready,
        Navbar,
        Page,
        Messages,
        MessagesTitle,
        Message,
        Messagebar,
        Icon,
    } from "framework7-svelte";
    import { showbar } from "../js/store";
    import { db, user } from "../js/gun";

    showbar.set(false);
    let messagebarInstance;
    let typingMessage = null;
    let messageText = "";

    let messagesData = [];

    db.get("usernames")
        .get(`#${username}`)
        .once(async (a) => {
            delete a._;
            pub = JSON.stringify(a).split(':"')[1].split('"}')[0];
            db.user(pub)
                .get("online")
                .on((a) => {
                    userstatus = a;
                });

            await db
                .get(`~${pub}`)
                .get("cert")
                .get("inbox")
                .once((a) => {
                    cert = a;
                });

            await db
                .get(`~${pub}`)
                .get("inbox")
                .get(user.is.pub)
                .on((a) => {
                    if (a) {
                        delete a._;
                        Object.entries(a).forEach((v) => {
                            let val = v[1];
                            let time = v[0];
                            let obj = {
                                type: "sent",
                                text: val,
                                time: time,
                            };
                            messagesData = [...messagesData, obj];
                        });
                    }
                });

            // fatching my messages for user
            await user
                .get("inbox")
                .get(pub)
                .on((a) => {
                    if (a) {
                        delete a._;
                        Object.entries(a).forEach((v) => {
                            let val = v[1];
                            let time = v[0];
                            let obj = {
                                type: "received",
                                text: val,
                                time: time,
                            };
                            messagesData = [...messagesData, obj];
                        });
                    }
                });
        });

    function process() {
        console.log(messagesData);
        messagesData = messagesData.sort((a, b) => a.time - b.time);
        messagesData = messagesData.filter((obj, index, array) => {
            return index === array.findIndex((item) => item.time === obj.time);
        });
        console.log(messagesData);
    }

    $: messagesData, process();

    onMount(() => {
        f7ready(() => {
            messagebarInstance = f7.messagebar.get(".messagebar");
        });
    });

    function isFirstMessage(message, index) {
        const previousMessage = messagesData[index - 1];
        if (message.isTitle) return false;
        if (
            !previousMessage ||
            previousMessage.type !== message.type ||
            previousMessage.name !== message.name
        )
            return true;
        return false;
    }
    function isLastMessage(message, index) {
        const nextMessage = messagesData[index + 1];
        if (message.isTitle) return false;
        if (
            !nextMessage ||
            nextMessage.type !== message.type ||
            nextMessage.name !== message.name
        )
            return true;
        return false;
    }

    function sendMessage() {
        const text = messageText.replace(/\n/g, "<br>").trim();
        messageText = "";
        // Get the current date in milliseconds since January 1, 1970, UTC
        let currentDateInMillis = new Date().getTime();

        // Convert milliseconds to seconds
        let currentDateInSeconds = Math.floor(currentDateInMillis / 1000);

        db.user(pub)
            .get("inbox")
            .get(user.is.pub)
            .get(currentDateInSeconds)
            .put(text, null, { opt: { cert: cert } });
    }
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<Page>
    <Navbar
        title={username}
        subtitle={userstatus}
        backLink=" "
        on:clickBack={() => {
            showbar.set(true);
        }}
    />

    <Messagebar
        placeholder="Type a message"
        value={messageText}
        onInput={(e) => (messageText = e.target.value)}
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <a class="link icon-only" slot="inner-end" on:click={sendMessage}>
            <Icon ios="f7:arrow_up_circle_fill" md="material:send" />
        </a>
    </Messagebar>

    <Messages>
        <!-- <MessagesTitle><b>Sunday, Feb 9,</b> 12:58</MessagesTitle> -->
        {#each messagesData as message, index (index)}
            <Message
                type={message.type}
                image={message.image}
                first={isFirstMessage(message, index)}
                last={isLastMessage(message, index)}
                htmlText={message.text}
            />
        {/each}
        {#if typingMessage}
            <Message
                type="received"
                typing={true}
                first={true}
                last={true}
                tail={true}
                header={`typing`}
                avatar={typingMessage.avatar}
            />
        {/if}
    </Messages>
</Page>
