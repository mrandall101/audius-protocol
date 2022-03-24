from datetime import datetime

from src import models
from src.models.models import WalletChain
from src.tasks.aggregates import get_latest_blocknumber
from src.utils import helpers
from src.utils.db_session import get_db


def query_creator_by_name(app, creator_name=None):
    """Return list of creators filtered by name (if present)"""
    query_results = None
    with app.app_context():
        db = get_db()

        with db.scoped_session() as session:
            if creator_name is not None:
                query_results = (
                    session.query(models.User)
                    .filter(models.User.name == creator_name)
                    .order_by(models.User.user_id)
                    .all()
                )
            else:
                query_results = (
                    session.query(models.User).order_by(models.User.user_id).all()
                )

            assert query_results is not None
            return_list = helpers.query_result_to_list(query_results)
            return return_list


def toBytes(val, length=32):
    val = val[:length]
    return bytes(val, "utf-8")


def populate_mock_db_blocks(db, min, max):
    """
    Helper function to populate the mock DB with blocks

    Args:
        db - sqlalchemy db session
        min - min block number
        max - max block number
    """
    with db.scoped_session() as session:
        for i in range(min, max):
            block = models.Block(
                blockhash=hex(i),
                number=i,
                parenthash="0x01",
                is_current=(i == 0),
            )
            session.add(block)
            session.flush()


def populate_mock_db(db, entities, block_offset=None):
    """
    Helper function to populate the mock DB with tracks, users, plays, and follows

    Args:
        db - sqlalchemy db session
        entities - dict of keys tracks, users, plays of arrays of metadata
    """
    with db.scoped_session() as session:
        # check if blocknumber already exists for longer running tests
        if block_offset is None:
            block_offset = get_latest_blocknumber(session)
            if block_offset:
                block_offset += 1
            else:
                block_offset = 0

        tracks = entities.get("tracks", [])
        playlists = entities.get("playlists", [])
        users = entities.get("users", [])
        follows = entities.get("follows", [])
        reposts = entities.get("reposts", [])
        saves = entities.get("saves", [])
        track_routes = entities.get("track_routes", [])
        remixes = entities.get("remixes", [])
        stems = entities.get("stems", [])
        challenges = entities.get("challenges", [])
        user_challenges = entities.get("user_challenges", [])
        plays = entities.get("plays", [])
        aggregate_plays = entities.get("aggregate_plays", [])
        aggregate_track = entities.get("aggregate_track", [])
        aggregate_monthly_plays = entities.get("aggregate_monthly_plays", [])
        aggregate_user = entities.get("aggregate_user", [])
        indexing_checkpoints = entities.get("indexing_checkpoints", [])
        user_listening_history = entities.get("user_listening_history", [])
        hourly_play_counts = entities.get("hourly_play_counts", [])
        user_bank_accounts = entities.get("user_bank_accounts", [])
        associated_wallets = entities.get("associated_wallets", [])

        num_blocks = max(
            len(tracks), len(users), len(follows), len(saves), len(reposts)
        )
        for i in range(block_offset, block_offset + num_blocks):
            max_block = (
                session.query(models.Block).filter(models.Block.number == i).first()
            )
            session.query(models.Block).filter(models.Block.is_current == True).update(
                {"is_current": False}
            )
            if not max_block:
                block = models.Block(
                    blockhash=hex(i),
                    number=i,
                    parenthash="0x01",
                    is_current=(i == block_offset + num_blocks - 1),
                )
                session.add(block)
                session.flush()

        for i, track_meta in enumerate(tracks):
            track_id = track_meta.get("track_id", i)

            # mark previous tracks as is_current = False
            session.query(models.Track).filter(models.Track.is_current == True).filter(
                models.Track.track_id == track_id
            ).update({"is_current": False})

            track = models.Track(
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
                track_id=track_id,
                title=track_meta.get("title", f"track_{i}"),
                is_current=track_meta.get("is_current", True),
                is_delete=track_meta.get("is_delete", False),
                owner_id=track_meta.get("owner_id", 1),
                route_id=track_meta.get("route_id", ""),
                track_segments=track_meta.get("track_segments", []),
                tags=track_meta.get("tags", None),
                genre=track_meta.get("genre", ""),
                updated_at=track_meta.get("updated_at", datetime.now()),
                created_at=track_meta.get("created_at", datetime.now()),
                release_date=track_meta.get("release_date", None),
                is_unlisted=track_meta.get("is_unlisted", False),
            )
            session.add(track)
        for i, playlist_meta in enumerate(playlists):
            playlist = models.Playlist(
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
                playlist_id=playlist_meta.get("playlist_id", i),
                is_current=playlist_meta.get("is_current", True),
                is_delete=playlist_meta.get("is_delete", False),
                playlist_owner_id=playlist_meta.get("playlist_owner_id", 1),
                is_album=playlist_meta.get("is_album", False),
                is_private=playlist_meta.get("is_private", False),
                playlist_name=playlist_meta.get("playlist_name", f"playlist_{i}"),
                playlist_contents=playlist_meta.get(
                    "playlist_contents", {"track_ids": []}
                ),
                playlist_image_multihash=playlist_meta.get(
                    "playlist_image_multihash", ""
                ),
                playlist_image_sizes_multihash=playlist_meta.get(
                    "playlist_image_sizes_multihash", ""
                ),
                description=playlist_meta.get("description", f"description_{i}"),
                upc=playlist_meta.get("upc", f"upc_{i}"),
                updated_at=playlist_meta.get("updated_at", datetime.now()),
                created_at=playlist_meta.get("created_at", datetime.now()),
            )
            session.add(playlist)

        for i, user_meta in enumerate(users):
            user = models.User(
                blockhash=hex(i + block_offset),
                blocknumber=i + block_offset,
                user_id=user_meta.get("user_id", i),
                is_current=True,
                handle=user_meta.get("handle", str(i)),
                handle_lc=user_meta.get("handle", str(i)).lower(),
                wallet=user_meta.get("wallet", str(i)),
                bio=user_meta.get("bio", str(i)),
                profile_picture=user_meta.get("profile_picture"),
                profile_picture_sizes=user_meta.get("profile_picture_sizes"),
                cover_photo=user_meta.get("cover_photo"),
                cover_photo_sizes=user_meta.get("cover_photo_sizes"),
                updated_at=user_meta.get("updated_at", datetime.now()),
                created_at=user_meta.get("created_at", datetime.now()),
            )
            user_bank = models.UserBankAccount(
                signature=f"0x{i}",
                ethereum_address=user_meta.get("wallet", str(i)),
                bank_account=f"0x{i}",
                created_at=datetime.now(),
            )
            session.add(user)
            session.add(user_bank)

        for i, follow_meta in enumerate(follows):
            follow = models.Follow(
                blockhash=hex(i + block_offset),
                blocknumber=follow_meta.get("blocknumber", i + block_offset),
                follower_user_id=follow_meta.get("follower_user_id", i + 1),
                followee_user_id=follow_meta.get("followee_user_id", i),
                is_current=follow_meta.get("is_current", True),
                is_delete=follow_meta.get("is_delete", False),
                created_at=follow_meta.get("created_at", datetime.now()),
            )
            session.add(follow)
        for i, repost_meta in enumerate(reposts):
            repost = models.Repost(
                blockhash=hex(i + block_offset),
                blocknumber=repost_meta.get("blocknumber", i + block_offset),
                user_id=repost_meta.get("user_id", i + 1),
                repost_item_id=repost_meta.get("repost_item_id", i),
                repost_type=repost_meta.get("repost_type", "track"),
                is_current=repost_meta.get("is_current", True),
                is_delete=repost_meta.get("is_delete", False),
                created_at=repost_meta.get("created_at", datetime.now()),
            )
            session.add(repost)
        for i, save_meta in enumerate(saves):
            save = models.Save(
                blockhash=hex(i + block_offset),
                blocknumber=save_meta.get("blocknumber", i + block_offset),
                user_id=save_meta.get("user_id", i + 1),
                save_item_id=save_meta.get("save_item_id", i),
                save_type=save_meta.get("save_type", "track"),
                is_current=save_meta.get("is_current", True),
                is_delete=save_meta.get("is_delete", False),
                created_at=save_meta.get("created_at", datetime.now()),
            )
            session.add(save)

        for i, play_meta in enumerate(plays):
            play = models.Play(
                id=play_meta.get("id", i + 1),
                user_id=play_meta.get("user_id", i + 1),
                source=play_meta.get("source", None),
                play_item_id=play_meta.get("item_id", i + 1),
                slot=play_meta.get("slot", i + 1),
                signature=play_meta.get("signature", None),
                created_at=play_meta.get("created_at", datetime.now()),
                updated_at=play_meta.get("updated_at", datetime.now()),
            )
            session.add(play)

        for i, aggregate_play_meta in enumerate(aggregate_plays):
            aggregate_play = models.AggregatePlays(
                play_item_id=aggregate_play_meta.get("play_item_id", i),
                count=aggregate_play_meta.get("count", 0),
            )
            session.add(aggregate_play)

        for i, aggregate_track_meta in enumerate(aggregate_track):
            aggregate_track = models.AggregateTrack(
                track_id=aggregate_track_meta.get("track_id", i),
                repost_count=aggregate_track_meta.get("repost_count", 0),
                save_count=aggregate_track_meta.get("save_count", 0),
            )
            session.add(aggregate_track)

        for i, aggregate_monthly_play_meta in enumerate(aggregate_monthly_plays):
            aggregate_monthly_play = models.AggregateMonthlyPlays(
                play_item_id=aggregate_monthly_play_meta.get("play_item_id", i),
                timestamp=aggregate_monthly_play_meta.get("timestamp", i),
                count=aggregate_monthly_play_meta.get("count", 0),
            )
            session.add(aggregate_monthly_play)

        for i, aggregate_user_meta in enumerate(aggregate_user):
            user = models.AggregateUser(
                user_id=aggregate_user_meta.get("user_id", i),
                track_count=aggregate_user_meta.get("track_count", 0),
                playlist_count=aggregate_user_meta.get("playlist_count", 0),
                album_count=aggregate_user_meta.get("album_count", 0),
                follower_count=aggregate_user_meta.get("follower_count", 0),
                following_count=aggregate_user_meta.get("following_count", 0),
                repost_count=aggregate_user_meta.get("repost_count", 0),
                track_save_count=aggregate_user_meta.get("track_save_count", 0),
            )
            session.add(user)

        for i, user_listening_history_meta in enumerate(user_listening_history):
            user_listening_history = models.UserListeningHistory(
                user_id=user_listening_history_meta.get("user_id", i + 1),
                listening_history=user_listening_history_meta.get(
                    "listening_history", None
                ),
            )
            session.add(user_listening_history)

        for i, hourly_play_count_meta in enumerate(hourly_play_counts):
            hourly_play_count = models.HourlyPlayCounts(
                hourly_timestamp=hourly_play_count_meta.get(
                    "hourly_timestamp", datetime.now()
                ),
                play_count=hourly_play_count_meta.get("play_count", 0),
            )
            session.add(hourly_play_count)

        if indexing_checkpoints:
            session.execute(
                "TRUNCATE TABLE indexing_checkpoints"
            )  # clear primary keys before adding
            for i, indexing_checkpoint_meta in enumerate(indexing_checkpoints):
                indexing_checkpoint = models.IndexingCheckpoints(
                    tablename=indexing_checkpoint_meta.get("tablename", None),
                    last_checkpoint=indexing_checkpoint_meta.get("last_checkpoint", 0),
                )
                session.add(indexing_checkpoint)

        for i, route_meta in enumerate(track_routes):
            route = models.TrackRoute(
                slug=route_meta.get("slug", ""),
                title_slug=route_meta.get("title_slug", ""),
                blockhash=hex(i + block_offset),
                blocknumber=route_meta.get("blocknumber", i + block_offset),
                owner_id=route_meta.get("owner_id", i + 1),
                track_id=route_meta.get("track_id", i + 1),
                is_current=route_meta.get("is_current", True),
                txhash=route_meta.get("txhash", ""),
                collision_id=route_meta.get("collision_id", 0),
            )
            session.add(route)

        for i, remix_meta in enumerate(remixes):
            remix = models.Remix(
                parent_track_id=remix_meta.get("parent_track_id", i),
                child_track_id=remix_meta.get("child_track_id", i + 1),
            )
            session.add(remix)
        for i, stems_meta in enumerate(stems):
            stem = models.Stem(
                parent_track_id=stems_meta.get("parent_track_id", i),
                child_track_id=stems_meta.get("child_track_id", i + 1),
            )
            session.add(stem)

        for i, challenge_meta in enumerate(challenges):
            challenge = models.Challenge(
                id=challenge_meta.get("id", ""),
                type=challenge_meta.get("type", ""),
                amount=challenge_meta.get("amount", ""),
                active=challenge_meta.get("active", True),
                step_count=challenge_meta.get("step_count", None),
                starting_block=challenge_meta.get("starting_block", None),
            )
            session.add(challenge)
        for i, user_challenge_meta in enumerate(user_challenges):
            user_challenge = models.UserChallenge(
                challenge_id=user_challenge_meta.get("challenge_id", ""),
                user_id=user_challenge_meta.get("user_id", 1),
                specifier=user_challenge_meta.get("specifier", ""),
                is_complete=user_challenge_meta.get("is_complete", False),
                completed_blocknumber=user_challenge_meta.get(
                    "completed_blocknumber", 1 + block_offset
                ),
                current_step_count=user_challenge_meta.get("current_step_count", None),
            )
            session.add(user_challenge)
        for i, user_bank_account in enumerate(user_bank_accounts):
            bank = models.UserBankAccount(
                signature=user_bank_account.get("signature", ""),
                ethereum_address=user_bank_account.get("ethereum_address", ""),
                bank_account=user_bank_account.get("bank_account", ""),
                created_at=user_bank_account.get("created_at", datetime.now()),
            )
            session.add(bank)
        for i, associated_wallet in enumerate(associated_wallets):
            wallet = models.AssociatedWallet(
                blockhash=associated_wallet.get("blockhash", hex(i + block_offset)),
                blocknumber=associated_wallet.get("blocknumber", i + block_offset),
                is_current=associated_wallet.get("is_current", True),
                is_delete=associated_wallet.get("is_delete", False),
                user_id=associated_wallet.get("user_id", 1),
                wallet=associated_wallet.get("wallet", str(i)),
                chain=associated_wallet.get("chain", WalletChain.sol),
            )
            session.add(wallet)

        session.flush()
